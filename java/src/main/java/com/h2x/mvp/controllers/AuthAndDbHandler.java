package com.h2x.mvp.controllers;

import net.bytebuddy.implementation.bytecode.Throw;
import org.hibernate.Session;

import java.io.IOException;

public interface AuthAndDbHandler <T, K extends Throwable> {
    T apply(Session s, com.h2x.mvp.entities.Session session) throws K;
}
