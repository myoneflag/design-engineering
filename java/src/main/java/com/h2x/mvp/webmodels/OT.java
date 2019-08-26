package com.h2x.mvp.webmodels;

import org.immutables.value.Value;

/**
 * I was really hoping that we didn't have to replicate any node code but it looks like we do.
 */
public abstract class OT {
    @Value.Default
    int id() {
        return -1;
    }
    abstract String type();
}
