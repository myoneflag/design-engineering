package com.h2x.mvp.entities;

import com.h2x.mvp.configuration.SecurityConfig;
import org.springframework.security.crypto.bcrypt.BCrypt;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.OneToOne;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Entity
public class Login {
    public Login() {};

    public Login(String username, String passwordHash, String passwordSalt) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.passwordSalt = passwordSalt;
    }

    public String getUsername() {
        return username;
    }

    public String getPasswordSalt() {
        return passwordSalt;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setPasswordHash(String password) {
        this.passwordHash = password;
    }

    public void setPasswordSalt(String passwordSalt) {
        this.passwordSalt = passwordSalt;
    }

    public boolean isAdmin() {
        return isAdmin;
    }

    public void setAdmin(boolean admin) {
        isAdmin = admin;
    }

    public boolean isSuperUser() {
        return isSuperUser;
    }

    public void setSuperUser(boolean superUser) {
        isSuperUser = superUser;
    }

    @Id
    private String username;
    private String passwordHash;
    private String passwordSalt;
    private boolean isAdmin;
    private boolean isSuperUser;

    public boolean authenticate(String password) {
        String result = BCrypt.hashpw(password, passwordSalt);
        return result.equals(passwordHash);
    }

    public void resetPassword(String newPassword) {
        this.passwordHash = BCrypt.hashpw(newPassword, this.passwordSalt);
    }

    public Session getAndRefreshValidSession(org.hibernate.Session dbSession) {
        if (session == null) return null;
        if (session.getExpiresOn().isBefore(LocalDateTime.now())) {
            dbSession.delete(session);
            return null;
        } else {
            LocalDateTime c = LocalDateTime.now();
            c = c.plus(SecurityConfig.SESSION_DURATION_MINUTES, ChronoUnit.MINUTES);
            session.setExpiresOn(c);
            return session;
        }
    }

    public static Login createObject(String username, String password) {
        Login login = new Login();
        login.username = username;
        login.passwordSalt = BCrypt.gensalt();
        login.resetPassword(password);
        return login;
    }

    @OneToOne(mappedBy = "login")
    private Session session;

    @OneToOne(mappedBy = "login")
    private Profile profile;

    public Profile getProfile() {
        return profile;
    }

    public void setProfile(Profile profile) {
        this.profile = profile;
    }

    public Session getSession() {
        return session;
    }

    public void setSession(Session session) {
        this.session = session;
    }
}
