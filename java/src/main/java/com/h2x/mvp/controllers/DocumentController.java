package com.h2x.mvp.controllers;

import com.h2x.mvp.entities.Document;
import com.h2x.mvp.entities.Operation;
import com.h2x.mvp.entities.Session;
import org.springframework.boot.json.JsonParser;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// This is for document entities, and drawings.
@RestController
public class DocumentController {

    @RequestMapping("api/document/operation")
    public Result ApplyOperation(@CookieValue("session-id") String sessionId, @RequestBody String request) {
        // There should only be one document in the database.
        return Session.withAuthAndDb(sessionId, (s, session) -> {

            DocumentWebSockets.pushOperation(request);
            return new Result(true, "");
        }, new Result(false, ""));
    }

    static class DocumentInstruction {
        public DocumentInstruction(Operation o) {
            this.operation = o;
        }

        public DocumentInstruction(boolean t) {
            this.terminate = t;
        }
        Operation operation;
        boolean terminate = false;
    }

    public static class Result {
        public Result(boolean success, String message) {
            this.success = success;
            this.message = message;
        }

        public boolean success;
        public String message;
    }
}
