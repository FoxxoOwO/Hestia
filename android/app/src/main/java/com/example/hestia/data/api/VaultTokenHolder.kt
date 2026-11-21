package com.example.hestia.data.api

/**
 * Krátkodobý token vydaný serverem po úspěšném zadání PINu trezoru.
 * Drží se pouze v paměti procesu – po restartu aplikace je nutné PIN zadat znovu.
 */
object VaultTokenHolder {
    @Volatile
    var token: String? = null

    fun clear() {
        token = null
    }
}
