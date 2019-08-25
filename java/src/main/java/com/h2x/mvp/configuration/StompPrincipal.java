package com.h2x.mvp.configuration;

import java.security.Principal;
import java.util.UUID;

public class StompPrincipal implements Principal {
    private String name;

    public StompPrincipal(String name) {
        this.name = name;
    }

    public StompPrincipal() {
        this.name = UUID.randomUUID().toString();
    }

    @Override
    public String getName() {
        return name;
    }
}
