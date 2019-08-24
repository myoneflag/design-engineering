package com.h2x.mvp.entities;

import com.h2x.mvp.configuration.SecurityConfig;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.function.Function3;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.function.BiFunction;
import java.util.function.Function;

@Entity
public class Session {
    public Session() {};
    public Session(org.hibernate.Session dbSession, Login login, int expiryMinutes) {
        this.login = login;
        this.expiresOn = LocalDateTime.now().plus(expiryMinutes, ChronoUnit.MINUTES);
        this.id = UUID.randomUUID().toString();
        while (dbSession.createQuery("FROM Session S WHERE S.id = :id").setParameter("id", this.id).list().size() > 0) {
            this.id = UUID.randomUUID().toString();
        }
        dbSession.save(this);
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Login getLogin() {
        return login;
    }

    public void setLogin(Login login) {
        this.login = login;
    }

    public LocalDateTime getExpiresOn() {
        return expiresOn;
    }

    public void setExpiresOn(LocalDateTime expiresOn) {
        this.expiresOn = expiresOn;
    }

    @Id
    private String id;

    @OneToOne
    private Login login;

    private LocalDateTime expiresOn;

    public void refresh(org.hibernate.Session dbSession, int durationMinutes) {
        this.expiresOn = LocalDateTime.now().plus(durationMinutes, ChronoUnit.MINUTES);
        dbSession.update(this);
    }

    public void refreshToken(org.hibernate.Session dbSession, int durationMinutes) {
        dbSession.delete(this);
        this.id = UUID.randomUUID().toString();
        while (dbSession.createQuery("FROM Session S WHERE S.id = :id").setParameter("id", this.id).list().size() > 0) {
            this.id = UUID.randomUUID().toString();
        }
        dbSession.save(this);
        refresh(dbSession, durationMinutes);
    }

    public static <T> T withAuth(String sessionId, BiFunction<org.hibernate.Session, Session, T> fun) {
        return Database.withSession((dbSession) -> {

            List<Session> sessions = dbSession.createQuery("FROM Session S WHERE S.id = :id")
                    .setParameter("id", sessionId)
                    .list();

            for (Session session: sessions) {
                session.refresh(dbSession, SecurityConfig.SESSION_DURATION_MINUTES);
                return fun.apply(dbSession, session);
            }

            // TODO: 401
            return null;
        });
    }
}
