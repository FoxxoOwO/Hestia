package com.example.hestia.util

import com.example.hestia.data.api.VaultTokenHolder
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

class ErrorsTest {

    @Test
    fun friendly_usesOriginalMessage() {
        assertEquals("Něco se pokazilo", RuntimeException("Něco se pokazilo").friendly())
    }

    @Test
    fun friendly_hasFallbackForEmptyMessage() {
        assertEquals("Neznámá chyba", Exception().friendly())
    }

    @Test
    fun friendly_mapsNetworkErrorsToCzech() {
        assertEquals(
            "Server nenalezen. Zkontrolujte adresu v nastavení.",
            UnknownHostException().friendly()
        )
        assertEquals(
            "Nelze se připojit k serveru. Běží Hestia server?",
            ConnectException().friendly()
        )
        assertEquals("Server neodpovídá (timeout).", SocketTimeoutException().friendly())
    }

    @Test
    fun vaultToken_isMemoryOnlyAndCanBeCleared() {
        VaultTokenHolder.token = "vault-token"
        assertEquals("vault-token", VaultTokenHolder.token)
        VaultTokenHolder.clear()
        assertNull(VaultTokenHolder.token)
    }
}
