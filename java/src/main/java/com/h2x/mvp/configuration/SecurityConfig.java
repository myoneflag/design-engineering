package com.h2x.mvp.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;

@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    public static final int SESSION_DURATION_MINUTES = 60*24;

    @Override
    protected void configure(HttpSecurity security) throws Exception
    {
        security.httpBasic().disable();
        security.cors().and().csrf().disable();
    }
}
