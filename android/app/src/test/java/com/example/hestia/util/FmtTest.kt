package com.example.hestia.util

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class FmtTest {

    @Test
    fun parseIso_handlesDateUtcAndOffset() {
        assertNotNull(Fmt.parseIso("2026-11-21"))
        assertNotNull(Fmt.parseIso("2026-11-21T10:15:30"))
        assertNotNull(Fmt.parseIso("2026-11-21T10:15:30Z"))
        assertNotNull(Fmt.parseIso("2026-11-21T10:15:30+02:00"))
        assertNotNull(Fmt.parseIso("2026-11-21T10:15:30.123456Z"))
    }

    @Test
    fun parseIso_returnsNullForInvalidInput() {
        assertNull(Fmt.parseIso(null))
        assertNull(Fmt.parseIso(""))
        assertNull(Fmt.parseIso("not-a-date"))
    }

    @Test
    fun date_formatsIsoToCzech() {
        assertEquals("21. 11. 2026", Fmt.date("2026-11-21"))
        assertEquals("—", Fmt.date(null))
    }

    @Test
    fun daysUntilText_coversBoundaries() {
        assertEquals("—", Fmt.daysUntilText(null))
        assertEquals("dnes", Fmt.daysUntilText(0))
        assertEquals("zítra", Fmt.daysUntilText(1))
        assertEquals("za 5 d", Fmt.daysUntilText(5))
        assertEquals("před 2 d", Fmt.daysUntilText(-2))
    }

    @Test
    fun addDaysFromToday_returnsIsoDate() {
        val result = Fmt.addDaysFromToday(7)
        assertNotNull(Fmt.parseIso(result))
        assertEquals(10, result.length)
    }
}
