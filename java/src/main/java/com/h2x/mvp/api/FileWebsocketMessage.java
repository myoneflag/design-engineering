package com.h2x.mvp.api;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.h2x.mvp.webmodels.ImmutableBackground;
import org.immutables.value.Value;

@Value.Immutable
@JsonSerialize(as = ImmutableFileWebsocketMessage.class)
@JsonDeserialize(as = ImmutableFileWebsocketMessage.class)
public interface FileWebsocketMessage {
    String type();
    Object operation();
    String message();
}
