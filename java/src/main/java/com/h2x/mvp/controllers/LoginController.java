package com.h2x.mvp.controllers;

import com.h2x.mvp.configuration.SecurityConfig;
import com.h2x.mvp.entities.Database;
import com.h2x.mvp.entities.Login;
import com.h2x.mvp.entities.Session;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
public class LoginController {

    @RequestMapping("api/login")
    public LoginResult login(@RequestBody Credentials credentials) {
        LoginResult result = Database.withSession((s) -> {
            List<Login> logins = s.createQuery(
                    "FROM Login L WHERE L.username = :username"
            ).setParameter(
                    "username", credentials.username
            ).list();


            for (Login thisLogin: logins) {
                if (thisLogin.authenticate(credentials.password)) {
                    // Make le session token
                    // Maybe they already have session token
                    Session session = thisLogin.getAndRefreshValidSession(s);
                    if (session != null) {
                        return new LoginResult(true, session.getId(), "Retrieving existing token", session.getLogin().getUsername());
                    } else {
                        session = new Session(s, thisLogin, SecurityConfig.SESSION_DURATION_MINUTES);
                        return new LoginResult(true, session.getId(), "Created new session token", session.getLogin().getUsername());
                    }
                } else {
                    return new LoginResult(false, "", "Login failed. Password incorrect", null);
                }
            }

            // No logins
            return new LoginResult(false, "", "Login failed. Username not found: " + credentials.username, null);
        });
        return result;
    }

    @RequestMapping("api/logout")
    public LogoutResult logout(@CookieValue("session-id") String sessionId) {
        LogoutResult result = Database.withSession(s -> {
            List<Session> sessions = s.createQuery("FROM Session S WHERE S.id = :id")
                    .setParameter("id", sessionId)
                    .list();
            for (Session session: sessions) {
                s.delete(session);
                return new LogoutResult(true, "User " + session.getLogin().getUsername() + " is now logged out.");
            }
            return new LogoutResult(false, "No such session");
        });
        return result;
    }

    @RequestMapping("api/session")
    public SessionDetails sessionDetails(@CookieValue("session-id") String sessionId) {
        return Database.withSession(s -> {
            List<Session> sessions = s.createQuery("FROM Session S WHERE S.id = :id")
                    .setParameter("id", sessionId)
                    .list();
            for (Session session: sessions) {
                session.refresh(s, SecurityConfig.SESSION_DURATION_MINUTES);
                return new SessionDetails(true, session.getLogin().getUsername(), session.getExpiresOn());
            }
            return new SessionDetails(false, "", LocalDateTime.now());
        });
    }

    @RequestMapping("api/login/password")
    public LoginResult changePassword(@CookieValue("session-id") String sessionId, @RequestBody PasswordChangeRequest changeRequest) {
        return Session.withAuthAndDb(sessionId, (dbSession, session) -> {
            Login l = session.getLogin();
            if (l.authenticate(changeRequest.currentPassword)) {
                if (changeRequest.newPassword.length() < 8) {
                    return new LoginResult(false, "", "Password must be at least 8 characters", "");
                }
                l.resetPassword(changeRequest.newPassword);
                dbSession.saveOrUpdate(l);
                session.refreshToken(dbSession, SecurityConfig.SESSION_DURATION_MINUTES);
                return new LoginResult(true, session.getId(), "Password changed successfully", l.getUsername());
            } else {
                return new LoginResult(false, "", "Password incorrect", "");
            }
        }, new LoginResult(false, "", "You are not logged in", ""));
    }

    public static class PasswordChangeRequest {
        public String currentPassword;
        public String newPassword;
    }

    public static class SessionDetails {
        public SessionDetails(boolean success, String username, LocalDateTime expiresOn) {
            this.success = success;
            this.username = username;
            this.expiresOn = expiresOn;
        }

        public boolean success;
        public String username;
        public LocalDateTime expiresOn;
    }

    public static class LoginResult {
        public LoginResult(boolean success, String accessToken, String message, String username) {
            this.success = success;
            this.accessToken = accessToken;
            this.message = message;
            this.username = username;
        }

        public boolean success;
        public String accessToken;
        public String username;
        public String message;
    }

    public static class LogoutResult {
        public LogoutResult(boolean success, String message) {
            this.success = success;
            this.message = message;
        }

        public boolean success;
        public String message;
    }

    public static class Credentials {
        public String username;
        public String password;
    }
}
