package com.helixlab.raktarproject.controller;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerResponseContext;
import javax.ws.rs.container.ContainerResponseFilter;
import javax.ws.rs.ext.Provider;

/**
 *
 * @author mdrag
 */
@Provider
public class CorsFilter implements ContainerResponseFilter {

    private static final boolean DEBUG_MODE = false;
    private static final List<String> ALLOWED_URLS = Arrays.asList(
            "http://127.0.0.1:8080/",
             "http://127.0.0.1:5500",
             "http://localhost:4200"
    );

    @Override
    public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext) throws IOException {
        if (DEBUG_MODE) {
            // Minden kérést átenged
            responseContext.getHeaders().add("Access-Control-Allow-Origin", "*");
        } else {
            // Csak engedélyezett URL-eket enged át
            String url = requestContext.getHeaderString("Origin");
            if (url != null && ALLOWED_URLS.contains(url)) {
                responseContext.getHeaders().add("Access-Control-Allow-Origin", url);
            }
        }

        responseContext.getHeaders().add(
                "Access-Control-Allow-Credentials", "true");
        responseContext.getHeaders().add(
                "Access-Control-Allow-Headers",
                "origin, content-type, accept, authorization, token, x-requested-with, cache-control, Pragma, attachmenturl, Expires");
        responseContext.getHeaders().add(
                "Access-Control-Allow-Methods",
                "GET, POST, PUT, DELETE, OPTIONS, HEAD");
    }

}