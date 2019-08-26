package com.h2x.mvp.webmodels;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import org.immutables.value.Value;

@Value.Immutable
@JsonSerialize(as = ImmutableCoord.class)
@JsonDeserialize(as = ImmutableCoord.class)
public interface Coord {
    double x();
    double y();
}
