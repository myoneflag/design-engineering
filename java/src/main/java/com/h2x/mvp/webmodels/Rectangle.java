package com.h2x.mvp.webmodels;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import org.immutables.value.Value;

@Value.Immutable
@JsonSerialize(as = ImmutableRectangle.class)
@JsonDeserialize(as = ImmutableRectangle.class)
public interface Rectangle {
    double x();
    double y();
    double w();
    double h();
}
