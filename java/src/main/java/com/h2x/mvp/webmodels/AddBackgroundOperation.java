package com.h2x.mvp.webmodels;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import org.immutables.value.Value;

/**
 * Soon to be deprecated. We will not be modelling web data structures here. It will be strictly for API.
 */
@Value.Immutable
@JsonSerialize(as = ImmutableAddBackgroundOperation.class)
@JsonDeserialize(as = ImmutableAddBackgroundOperation.class)
public abstract class AddBackgroundOperation extends OT {

    @Value.Default
    String type() {
        return "ADD_BACKGROUND";
    }
    abstract Background background();
}
