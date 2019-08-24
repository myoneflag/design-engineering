package com.h2x.mvp.entities;

import javax.persistence.*;

@Entity
public class Profile {
    public Login getLogin() {
        return login;
    }

    public void setLogin(Login login) {
        this.login = login;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }


    @OneToOne
    @MapsId("username")
    private Login login;

    @Id
    private String username;
}
