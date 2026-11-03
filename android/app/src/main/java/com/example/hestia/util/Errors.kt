package com.example.hestia.util

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonPrimitive
import retrofit2.HttpException
import java.io.IOException
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

private val errorJson = Json { ignoreUnknownKeys = true; isLenient = true }

private fun parseDetail(body: String?): String? {
    if (body.isNullOrBlank()) return null
    return try {
        val obj = errorJson.parseToJsonElement(body) as? JsonObject ?: return null
        val detail = obj["detail"] ?: return null
        when (detail) {
            is kotlinx.serialization.json.JsonArray -> {
                // FastAPI validation errors: [{loc:[...], msg:"..."}]
                detail.joinToString("; ") { item ->
                    val o = item as? JsonObject ?: return@joinToString ""
                    val msg = o["msg"]?.jsonPrimitive?.contentOrNullSafe() ?: ""
                    val loc = (o["loc"] as? kotlinx.serialization.json.JsonArray)
                        ?.joinToString(".") { it.jsonPrimitive.contentOrNullSafe() ?: "" }
                    if (loc.isNullOrBlank()) msg else "$loc: $msg"
                }.ifBlank { null }
            }
            else -> detail.jsonPrimitive.contentOrNullSafe()
        }
    } catch (_: Exception) {
        null
    }
}

private fun kotlinx.serialization.json.JsonPrimitive.contentOrNullSafe(): String? =
    try {
        content
    } catch (_: Exception) {
        null
    }

/** Human readable, Czech, message for any error thrown by the API layer. */
fun Throwable.friendly(): String {
    val raw = message ?: ""
    return when (this) {
        is HttpException -> {
            val body = try {
                response()?.errorBody()?.string()
            } catch (_: Exception) {
                null
            }
            parseDetail(body) ?: when (code()) {
                400 -> "Neplatné zadání (400)"
                401 -> "Přihlášení vypršelo — přihlaste se znovu (401)"
                403 -> "Nemáte oprávnění pro tuto akci (403)"
                404 -> "Záznam nenalezen (404)"
                409 -> "Záznam už existuje nebo je používán (409)"
                422 -> "Neúplné nebo neplatné údaje (422)"
                500 -> "Chyba serveru (500)"
                else -> "Chyba serveru (${code()})"
            }
        }
        is UnknownHostException -> "Server nenalezen. Zkontrolujte adresu v nastavení."
        is ConnectException -> "Nelze se připojit k serveru. Běží Hestia server?"
        is SocketTimeoutException -> "Server neodpovídá (timeout)."
        is IOException -> "Chyba sítě: ${raw.ifBlank { "zkontrolujte připojení" }}"
        else -> raw.ifBlank { "Neznámá chyba" }
    }
}
