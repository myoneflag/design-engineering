package com.h2x.mvp.configuration;

import com.h2x.mvp.controllers.DocumentWebSockets;
import com.h2x.mvp.entities.Database;
import com.h2x.mvp.entities.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.ChannelInterceptorAdapter;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.server.HandshakeFailureException;
import org.springframework.web.socket.server.HandshakeHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;
import org.springframework.web.util.WebUtils;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
@CrossOrigin(origins = "*")
public class WebSocketMessageBrokerConfig implements WebSocketMessageBrokerConfigurer {

    Logger logger = LoggerFactory.getLogger(WebSocketMessageBrokerConfig.class);

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/document");
        config.setUserDestinationPrefix("/user");
        config.setApplicationDestinationPrefixes("/user");
    }

    public static class MyHandshakeHandler extends DefaultHandshakeHandler {

        @Override
        protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler,
                                          Map<String, Object> attributes) {
            // add your own code to determine the user
            return new StompPrincipal();
        }
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry stompEndpointRegistry) {
        stompEndpointRegistry
                .addEndpoint("api/websocket") // Set websocket endpoint to connect to
                .setAllowedOrigins("*")
                .setHandshakeHandler(new MyHandshakeHandler())
                .withSockJS()
                .setInterceptors(httpSessionHandshakeInterceptor());
    }

    @Bean
    public HandshakeInterceptor httpSessionHandshakeInterceptor() {
        return new HandshakeInterceptor() {
            @Override
            public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
                if (request instanceof ServletServerHttpRequest) {
                    ServletServerHttpRequest servletServerRequest = (ServletServerHttpRequest) request;
                    HttpServletRequest servletRequest = servletServerRequest.getServletRequest();
                    Cookie token = WebUtils.getCookie(servletRequest, "session-id");
                    return Session.withAuthAndDb(token != null ? token.getValue() : null, (db, s) -> {
                        attributes.put("session-id", token.getValue());
                        return true;
                    }, false);
                }
                return false;
            }
            @Override
            public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Exception exception) {
            }
        };
    }

    @EventListener
    public void onSocketDisconnected(SessionDisconnectEvent event) {
        StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());
        try {
            DocumentWebSockets.close(sha.getUser());
            logger.debug("[Disonnected] " + sha.getSessionId());
        } catch (InterruptedException e) {

            logger.debug("Error while [Disonnected] " + sha.getSessionId());
            e.printStackTrace();
        }
    }

    // Sadly, we must limit websocket threads to only one because of a limitation in Spring. With multiple websockets,
    // messages can come out of order.
    @Override
    public void configureClientOutboundChannel(ChannelRegistration registration) {
        registration.taskExecutor().corePoolSize(1);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.taskExecutor().corePoolSize(1);
    }
}
