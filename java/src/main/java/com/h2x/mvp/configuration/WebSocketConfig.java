package com.h2x.mvp.configuration;

import com.h2x.mvp.controllers.DocumentWebSockets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    Logger logger = LoggerFactory.getLogger(WebSocketConfig.class);
    public void registerWebSocketHandlers(WebSocketHandlerRegistry webSocketHandlerRegistry) {
        webSocketHandlerRegistry.addHandler(this.webSocketHandler(), "api/websocket");
    }

    @Bean
    public WebSocketHandler webSocketHandler() {
        logger.debug("Creating websocket handler");
        return new WebSocketHandler() {
            @Override
            public void afterConnectionEstablished(WebSocketSession webSocketSession) throws Exception {
                logger.debug("Connection established");
                StompHeaderAccessor headers = StompHeaderAccessor.create(StompCommand.CONNECT);
                headers.setAcceptVersion("1.1,1.2");
                headers.setHeartbeat(10000, 10000);
            }

            @Override
            public void handleMessage(WebSocketSession webSocketSession, WebSocketMessage<?> webSocketMessage) throws Exception {

            }

            @Override
            public void handleTransportError(WebSocketSession webSocketSession, Throwable throwable) throws Exception {

            }

            @Override
            public void afterConnectionClosed(WebSocketSession webSocketSession, CloseStatus closeStatus) throws Exception {
                logger.debug("Connection closed");
                DocumentWebSockets.close(webSocketSession.getPrincipal());
            }

            @Override
            public boolean supportsPartialMessages() {
                return false;
            }
        };
    }
}
