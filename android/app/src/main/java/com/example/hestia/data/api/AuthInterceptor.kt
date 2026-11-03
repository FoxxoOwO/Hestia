package com.example.hestia.data.api

import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor(
    private val tokenProvider: () -> String?,
    private val onUnauthorized: () -> Unit = {}
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val requestBuilder = chain.request().newBuilder()
            .header("Accept", "application/json")

        val token = tokenProvider()
        val hadToken = !token.isNullOrBlank()
        if (hadToken) {
            requestBuilder.header("Authorization", "Bearer $token")
        }

        val response = chain.proceed(requestBuilder.build())

        // Token vypršel nebo byl zneplatněn – odhlásíme uživatele, aby se appka
        // nepřilepila na rozbitý stav se samými chybami 401.
        if (hadToken && response.code == 401) {
            onUnauthorized()
        }
        return response
    }
}
