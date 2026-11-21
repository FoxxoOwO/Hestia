package com.example.hestia.data.api

import com.example.hestia.BuildConfig
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit

class ApiClient(
    private val tokenProvider: () -> String?,
    private val refreshTokenProvider: () -> String? = { null },
    private val onTokensRefreshed: (String, String?) -> Unit = { _, _ -> },
    private val onUnauthorized: () -> Unit = {}
) {
    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        isLenient = true
    }

    private var currentBaseUrl: String = "http://10.0.2.2:8000/"
    private var currentService: HestiaApiService? = null

    private val okHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .writeTimeout(20, TimeUnit.SECONDS)
            .addInterceptor(AuthInterceptor(tokenProvider, refreshTokenProvider, onTokensRefreshed, onUnauthorized))
            .apply {
                if (BuildConfig.DEBUG) {
                    addInterceptor(HttpLoggingInterceptor().apply {
                        level = HttpLoggingInterceptor.Level.BASIC
                        redactHeader("Authorization")
                        redactHeader("X-Vault-Token")
                    })
                }
            }
            .build()
    }

    @Synchronized
    fun getService(baseUrl: String): HestiaApiService {
        val sanitizedUrl = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"
        if (currentService == null || currentBaseUrl != sanitizedUrl) {
            currentBaseUrl = sanitizedUrl
            val retrofit = Retrofit.Builder()
                .baseUrl(sanitizedUrl)
                .client(okHttpClient)
                .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
                .build()
            currentService = retrofit.create(HestiaApiService::class.java)
        }
        return currentService!!
    }
}
