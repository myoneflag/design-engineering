package com.h2x.mvp.entities;

import org.hibernate.Session;

public interface SessionHandler<T, K extends Throwable> {
    T apply(Session session) throws K;
}
