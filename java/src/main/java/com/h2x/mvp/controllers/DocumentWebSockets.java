package com.h2x.mvp.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.h2x.mvp.api.FileWebsocketMessageType;
import com.h2x.mvp.api.ImmutableFileWebsocketMessage;
import com.h2x.mvp.entities.Database;
import com.h2x.mvp.entities.Document;
import com.h2x.mvp.entities.Operation;
import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.json.JsonParser;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.core.task.TaskExecutor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.socket.config.annotation.EnableWebSocket;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

import java.io.FileWriter;

@RestController
@EnableWebSocket
public class DocumentWebSockets {
    @Autowired
    private SimpMessagingTemplate template;

    static Logger logger = LoggerFactory.getLogger(DocumentWebSockets.class);

    @Autowired
    @Qualifier("threadConfig")
    TaskExecutor taskExecutor;

    @SubscribeMapping("/document")
    public void onSubscribe(Principal user) {
        logger.debug("Subscribing");
        logger.debug("Subscribing with  user " + user.getName());
        Boolean auth = Database.withSession(s_ -> {
            logger.debug("Auth'd and subscribed session uid " + user.getName());
            // We are authenticated.
            // The first thing we do is register a queue.
            documentTopics.put(user.getName(), new LinkedBlockingQueue<>());

            Database.withSession(s -> {
                // After we have registered the queue, we are allowed to look at the database.
                List<Operation> ops = s.createQuery("FROM Operation O ORDER BY O.orderIndex").list();
                for (Operation op: ops) {
                    submitOperation(op, user.getName());
                }
                submitLoadedMessage(user.getName());
                return null;
            });
            return true;
        });

        final String fuid = user.getName();
        if (auth) {
            taskExecutor.execute(() -> {
                logger.debug("Thread started for user " + fuid);
                while (true) {
                    BlockingQueue<DocumentController.DocumentInstruction> q = documentTopics.get(fuid);
                    DocumentController.DocumentInstruction di = null;
                    try {
                        di = q.poll(1, TimeUnit.MINUTES);
                    } catch (InterruptedException e) {
                        logger.debug("Thread for user " + fuid + " terminated via interruption");
                        break;
                    }
                    if (di != null && di.type == DocumentController.DocumentInstructionType.Terminate) {
                        documentTopics.remove(fuid);
                        logger.debug("Thread for user " + fuid + " terminated");
                        break;
                    }
                    if (di != null) {
                        try {
                            switch (di.type) {
                                case Delete:
                                    logger.debug("Thread for user " + fuid + " sending reset");
                                    template.convertAndSendToUser(fuid, "/document",
                                            ImmutableFileWebsocketMessage.builder()
                                                    .type(FileWebsocketMessageType.FILE_DELETED)
                                                    .message("")
                                                    .operation("")
                                                    .build()
                                    );
                                    break;
                                case Operation:
                                    logger.debug("Thread for user " + fuid + " sending " + new ObjectMapper().writeValueAsString(di.operation.getOperation()));
                                    template.convertAndSendToUser(fuid, "/document",
                                            ImmutableFileWebsocketMessage.builder()
                                                    .type(FileWebsocketMessageType.OPERATION)
                                                    .message("")
                                                    .operation(di.operation.getOperation())
                                                    .build()
                                    );
                                    break;
                                case Loaded:
                                    logger.debug("Thread for user " + fuid + " sending loaded message");
                                    template.convertAndSendToUser(fuid, "/document",
                                            ImmutableFileWebsocketMessage.builder()
                                                    .type(FileWebsocketMessageType.FILE_LOADED)
                                                    .message("")
                                                    .operation("")
                                                    .build()
                                    );
                                    break;
                                default:
                                    throw new IllegalArgumentException("Type of instruction is not handled here");
                            }
                        } catch (JsonProcessingException e) {
                            logger.debug("Thread for user " + fuid + " error converting and sending to user");
                            e.printStackTrace();
                        }
                    } else {
                        logger.debug("Thread for user " + fuid + " timed out. Trying again");
                    }
                }
            });
        }
    }

    static JsonParser jp = JsonParserFactory.getJsonParser();
    static ObjectMapper js = new ObjectMapper();

    public static void pushOperation(String request) {
        logger.debug("Push operation called for " + request);
        while (true) {
            try {
                logger.debug("Pushing an operation");
                pendingOperations.put(request);
                break;
            } catch (InterruptedException e) {
                logger.debug("Failed. Will retry...");
                try {
                    Thread.sleep(100);
                } catch (InterruptedException ex) {
                    ex.printStackTrace();
                }
                e.printStackTrace();
            }
        }
    }

    private static void saveAndBroadcastOperation(String request) {
        // If order of broadcast:
        // 1. Write to database
        // 2. Send to even handlers.
        // Order of registering file topic:
        // 1. Register event handler
        // 2. Read from database
        // This way, the registar will always get up-to-date information.

        Operation operation = Database.withSession(s -> {
            List<Document> docs = s.createQuery("FROM Document").list();
            // There is always 1 document and exactly one.
            Document d = docs.get(0);

            List<Operation> firstOp = s.createQuery("FROM Operation O ORDER BY O.orderIndex DESC").setMaxResults(1).list();
            int firstOrder = 0; // HUR HUR
            for (Operation prev: firstOp) {
                firstOrder = prev.getOrderIndex();
            }

            Operation op = new Operation();
            op.setOrderIndex(firstOrder+1);

            Map<String, Object> parsed = jp.parseMap(request);
            parsed.put("id", op.getOrderIndex());
            try {
                op.setOperation(js.writeValueAsString(parsed));
                op.setDocument(d);
                s.save(op);

                return op;
            } catch (JsonProcessingException e) {
                e.printStackTrace();
                return null;
            }
        });

        for (String k: documentTopics.keySet()) {
            BlockingQueue<DocumentController.DocumentInstruction> q = documentTopics.get(k);
            if (q != null) q.add(new DocumentController.DocumentInstruction(operation));
        }
    }

    public static void broadcastDelete() {
        for (String k: documentTopics.keySet()) {
            BlockingQueue<DocumentController.DocumentInstruction> q = documentTopics.get(k);
            var msg = new DocumentController.DocumentInstruction(DocumentController.DocumentInstructionType.Delete);
            if (q != null) q.add(msg);
        }
    }

    public static void submitOperation(Operation op, String uid) {
        BlockingQueue<DocumentController.DocumentInstruction> q = documentTopics.get(uid);
        if (q != null) q.add(new DocumentController.DocumentInstruction(op));
    }

    public static void submitLoadedMessage(String uid) {
        BlockingQueue<DocumentController.DocumentInstruction> q = documentTopics.get(uid);
        if (q != null) q.add(new DocumentController.DocumentInstruction(
                DocumentController.DocumentInstructionType.Loaded
        ));
    }

    static ConcurrentHashMap<String, BlockingQueue<DocumentController.DocumentInstruction>> documentTopics = new ConcurrentHashMap<>();

    // We use a queue here to manage operations concurrently.
    static BlockingQueue<String> pendingOperations = new LinkedBlockingQueue<>();

    /*
    Startup tasks for processing pushed
     */
    @Bean
    public CommandLineRunner schedulingRunner(@Qualifier("threadConfig") TaskExecutor executor) {
        return new CommandLineRunner() {
            public void run(String... args) throws Exception {
                logger.debug("Starting saving daemon");
                executor.execute(() -> {
                    while (true) {
                        String op = null;
                        try {
                            op = pendingOperations.poll(1, TimeUnit.MINUTES);
                        } catch (InterruptedException e) {
                            try {
                                Thread.sleep(1000);
                            } catch (InterruptedException ex) {
                                ex.printStackTrace();
                            }
                            e.printStackTrace();
                        }

                        if (op != null) {
                            saveAndBroadcastOperation(op);
                        }
                    }
                });
            }
        };
    }

    public static void close(Principal user) throws InterruptedException {
        logger.debug("Closing");
        if (user == null) return;
        if (documentTopics.containsKey(user.getName())) {
            logger.debug("Aborting user " + user.getName());
            documentTopics.get(user.getName()).put(
                    new DocumentController.DocumentInstruction(DocumentController.DocumentInstructionType.Terminate)
            );
        } else {
            logger.debug("User " + user.getName() + " not found...");
        }
    }
}
