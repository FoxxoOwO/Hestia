package com.example.hestia.data.api

import com.example.hestia.data.models.RefreshRequest
import com.example.hestia.data.models.RefreshTokenResponse
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import java.util.concurrent.TimeUnit

class AuthInterceptor(
    private val tokenProvider: () -> String?,
    private val refreshTokenProvider: () -> String? = { null },
    private val onTokensRefreshed: (String, String?) -> Unit = { _, _ -> },
    private val onUnauthorized: () -> Unit = {}
) : Interceptor {
    private val json = Json { ignoreUnknownKeys = true }

    override fun intercept(chain: Interceptor.Chain): Response {
        val requestBuilder = chain.request().newBuilder()
            .header("Accept", "application/json")

        val token = tokenProvider()
        val hadToken = !token.isNullOrBlank()
        if (hadToken) {
            requestBuilder.header("Authorization", "Bearer $token")
        }

        VaultTokenHolder.token?.let { vaultToken ->
            requestBuilder.header("X-Vault-Token", vaultToken)
        }

        var response = chain.proceed(requestBuilder.build())

        // Access token má jen 15 minut – při 401 se pokusíme o tichý refresh.
        if (hadToken && response.code == 401 && chain.request().header(RETRY_HEADER) == null) {
            val refreshed = refreshAccessToken(chain.request())
            response.close()
            if (refreshed != null) {
                val retry = requestBuilder
                    .header("Authorization", "Bearer $refreshed")
                    .header(RETRY_HEADER, "1")
                    .build()
                response = chain.proceed(retry)
                if (response.code == 401) onUnauthorized()
            } else {
                onUnauthorized()
            }
        } else if (hadToken && response.code == 401) {
            onUnauthorized()
        }

        return response
    }

    private fun refreshAccessToken(original: Request): String? {
        val refreshToken = refreshTokenProvider() ?: return null
        val refreshUrl = original.url.newBuilder()
            .encodedPath("/api/v1/auth/refresh")
            .build()

        val body = json.encodeToString(RefreshRequest(refreshToken))
            .toRequestBody("application/json".toMediaType())

        val client = OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .build()

        return try {
            val request = Request.Builder().url(refreshUrl).post(body).build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return null
                val payload = response.body?.string() ?: return null
                val tokens = json.decodeFromString<RefreshTokenResponse>(payload)
                onTokensRefreshed(tokens.access_token, tokens.refresh_token)
                tokens.access_token
            }
        } catch (e: Exception) {
            null
        }
    }

    private companion object {
        const val RETRY_HEADER = "X-Hestia-Token-Retry"
    }
}
