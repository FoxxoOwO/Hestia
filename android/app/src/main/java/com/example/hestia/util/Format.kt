package com.example.hestia.util

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * Date / number helpers built on java.util.* so they work on minSdk 24
 * (no java.time / desugaring required).
 */
object Fmt {

    private val isoFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply {
        isLenient = false
        timeZone = TimeZone.getDefault()
    }
    private val isoDateTimeFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).apply {
        isLenient = true
    }
    private val isoUtcFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).apply {
        isLenient = true
        timeZone = TimeZone.getTimeZone("UTC")
    }
    private val isoOffsetFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX", Locale.US).apply {
        isLenient = true
    }
    private val czechDateFormat = SimpleDateFormat("d. M. yyyy", Locale("cs", "CZ"))
    private val czechDateTimeFormat = SimpleDateFormat("d. M. yyyy HH:mm", Locale("cs", "CZ"))
    private val dayNameFormat = SimpleDateFormat("EEE", Locale("cs", "CZ"))
    private val monthFormat = SimpleDateFormat("LLLL yyyy", Locale("cs", "CZ"))

    fun today(): String = isoFormat.format(Date())

    fun nowDateTime(): String = isoDateTimeFormat.format(Date())

    fun iso(date: Date): String = isoFormat.format(date)

    fun parseIso(value: String?): Date? {
        if (value.isNullOrBlank()) return null
        val cleaned = value.trim()
        return try {
            when {
                cleaned.length <= 10 -> isoFormat.parse(cleaned)
                // backend může poslat UTC (…Z), offset (…+02:00) i mikrosekundy
                cleaned.endsWith("Z") -> isoUtcFormat.parse(cleaned.take(19))
                cleaned.length >= 25 && (cleaned[19] == '+' || cleaned[19] == '-') ->
                    isoOffsetFormat.parse(cleaned.take(25))
                else -> isoDateTimeFormat.parse(cleaned.take(19))
            }
        } catch (_: Exception) {
            null
        }
    }

    fun dateTime(value: String?): String {
        val d = parseIso(value) ?: return value ?: ""
        return if ((value ?: "").length > 10) czechDateTimeFormat.format(d) else czechDateFormat.format(d)
    }

    fun date(value: String?): String {
        val d = parseIso(value) ?: return value ?: "—"
        return czechDateFormat.format(d)
    }

    fun dayName(value: String?): String {
        val d = parseIso(value) ?: return ""
        return dayNameFormat.format(d).replaceFirstChar { it.uppercase() }
    }

    fun monthLabel(value: String?): String {
        val d = parseIso(value) ?: return ""
        return monthFormat.format(d).replaceFirstChar { it.uppercase() }
    }

    fun addDays(value: String?, days: Int): String {
        val cal = Calendar.getInstance()
        parseIso(value)?.let { cal.time = it }
        cal.add(Calendar.DAY_OF_YEAR, days)
        return isoFormat.format(cal.time)
    }

    fun addDaysFromToday(days: Int): String = addDays(today(), days)

    fun addMonths(value: String?, months: Int): String {
        val cal = Calendar.getInstance()
        parseIso(value)?.let { cal.time = it }
        cal.add(Calendar.MONTH, months)
        return isoFormat.format(cal.time)
    }

    fun daysUntil(value: String?): Int? {
        val target = parseIso(value) ?: return null
        val start = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val end = Calendar.getInstance().apply {
            time = target
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        return ((end.timeInMillis - start.timeInMillis) / 86_400_000L).toInt()
    }

    fun daysUntilText(days: Int?): String = when {
        days == null -> "—"
        days < 0 -> "před ${-days} d"
        days == 0 -> "dnes"
        days == 1 -> "zítra"
        else -> "za $days d"
    }

    /** Monday-based start of the week containing [date], shifted by [weekOffset]. */
    fun weekStart(date: String? = null, weekOffset: Int = 0): String {
        val cal = Calendar.getInstance()
        parseIso(date)?.let { cal.time = it }
        cal.firstDayOfWeek = Calendar.MONDAY
        val dow = cal.get(Calendar.DAY_OF_WEEK)
        val diff = if (dow == Calendar.SUNDAY) -6 else Calendar.MONDAY - dow
        cal.add(Calendar.DAY_OF_YEAR, diff + weekOffset * 7)
        return isoFormat.format(cal.time)
    }

    fun weekDates(startIso: String): List<String> = (0..6).map { addDays(startIso, it) }

    fun monthKey(): String {
        val cal = Calendar.getInstance()
        return String.format(Locale.US, "%04d-%02d", cal.get(Calendar.YEAR), cal.get(Calendar.MONTH) + 1)
    }

    fun monthKeyShift(months: Int): String {
        val cal = Calendar.getInstance()
        cal.add(Calendar.MONTH, months)
        return String.format(Locale.US, "%04d-%02d", cal.get(Calendar.YEAR), cal.get(Calendar.MONTH) + 1)
    }

    /** Month key (YYYY-MM) for the given ISO date. */
    fun monthKey(dateIso: String?): String {
        val cal = Calendar.getInstance()
        parseIso(dateIso)?.let { cal.time = it }
        return String.format(Locale.US, "%04d-%02d", cal.get(Calendar.YEAR), cal.get(Calendar.MONTH) + 1)
    }

    /** Shifts an existing month key (YYYY-MM) by [months]. */
    fun monthKeyShift(monthKey: String, months: Int): String {
        val cal = Calendar.getInstance()
        parseIso("$monthKey-01")?.let { cal.time = it }
        cal.add(Calendar.MONTH, months)
        return String.format(Locale.US, "%04d-%02d", cal.get(Calendar.YEAR), cal.get(Calendar.MONTH) + 1)
    }

    fun nowMillis(): Long = System.currentTimeMillis()

    fun isoFromMillis(millis: Long): String = isoFormat.format(Date(millis))

    fun millisFromIso(value: String?): Long? = parseIso(value)?.time

    fun number(value: Double, decimals: Int = 2): String {
        if (value == value.toLong().toDouble()) return value.toLong().toString()
        return String.format(Locale.US, "%.${decimals}f", value)
            .trimEnd('0')
            .trimEnd('.')
    }

    fun amount(value: Double?): String = if (value == null) "" else number(value)

    fun money(value: Double?): String {
        if (value == null) return "—"
        val nf = java.text.NumberFormat.getNumberInstance(Locale("cs", "CZ"))
        nf.maximumFractionDigits = if (value == value.toLong().toDouble()) 0 else 2
        nf.minimumFractionDigits = 0
        return "${nf.format(value)} Kč"
    }

    fun moneyPlain(value: Double?): String {
        if (value == null) return "0"
        val nf = java.text.NumberFormat.getNumberInstance(Locale("cs", "CZ"))
        nf.maximumFractionDigits = if (value == value.toLong().toDouble()) 0 else 2
        nf.minimumFractionDigits = 0
        return nf.format(value)
    }

    fun relative(value: String?): String {
        val d = parseIso(value) ?: return value ?: ""
        val diff = System.currentTimeMillis() - d.time
        val minutes = diff / 60_000
        val hours = diff / 3_600_000
        val days = diff / 86_400_000
        return when {
            minutes < 1 -> "právě teď"
            minutes < 60 -> "před $minutes min"
            hours < 24 -> "před $hours h"
            days == 1L -> "včera"
            days < 7 -> "před $days dny"
            days < 31 -> "před $days dny"
            else -> czechDateFormat.format(d)
        }
    }

    fun fileSize(bytes: Int): String = when {
        bytes <= 0 -> "—"
        bytes < 1024 -> "$bytes B"
        bytes < 1024 * 1024 -> String.format(Locale.US, "%.0f kB", bytes / 1024.0)
        else -> String.format(Locale.US, "%.1f MB", bytes / (1024.0 * 1024.0))
    }
}

object Labels {
    val rooms = listOf(
        "kitchen" to "Kuchyně",
        "living_room" to "Obývací pokoj",
        "bedroom" to "Ložnice",
        "bathroom" to "Koupelna",
        "hallway" to "Chodba",
        "garage" to "Garáž",
        "garden" to "Zahrada",
        "workshop" to "Dílna",
        "attic_cellar" to "Půda / Sklep",
        "general" to "Obecné"
    )

    val plantRooms = rooms.filterNot { it.first == "workshop" || it.first == "attic_cellar" }

    val shoppingCategories = listOf(
        "produce" to "Ovoce & zelenina",
        "dairy" to "Mléčné výrobky",
        "meat" to "Maso & ryby",
        "pantry" to "Trvanlivé",
        "bakery" to "Pekárna",
        "beverages" to "Nápoje",
        "household" to "Drogerie",
        "other" to "Ostatní"
    )

    val pantryCategories = listOf(
        "fridge" to "Lednice",
        "freezer" to "Mrazák",
        "pantry" to "Spíž",
        "produce" to "Ovoce & zelenina",
        "spices" to "Koření",
        "bakery" to "Pekárna",
        "other" to "Ostatní"
    )

    val recipeCategories = listOf(
        "produce" to "Ovoce & zelenina",
        "dairy" to "Mléčné výrobky",
        "meat" to "Maso & ryby",
        "pantry" to "Trvanlivé",
        "spices" to "Koření",
        "bakery" to "Pekárna",
        "other" to "Ostatní"
    )

    val difficulty = listOf("easy" to "Snadné", "medium" to "Střední", "hard" to "Náročné")
    val priceLevel = listOf("low" to "Levné", "medium" to "Střední", "high" to "Drahé")
    val mealTypes = listOf(
        "breakfast" to "Snídaně",
        "lunch" to "Oběd",
        "dinner" to "Večeře",
        "snack" to "Svačina"
    )
    val choreCategories = listOf(
        "routine" to "Běžná údržba",
        "deep_clean" to "Hluboký úklid",
        "maintenance" to "Technická údržba",
        "panic_mode" to "Panic mode"
    )
    val choreFrequencies = listOf(
        "daily" to "Denně",
        "weekly" to "Týdně",
        "biweekly" to "Dvakrát týdně",
        "monthly" to "Měsíčně",
        "seasonal" to "Sezónně",
        "as_needed" to "Dle potřeby"
    )
    val petSpecies = listOf(
        "dog" to "Pes",
        "cat" to "Kočka",
        "rabbit" to "Králík",
        "bird" to "Pták",
        "rodent" to "Hlodavec",
        "reptile" to "Plaz",
        "other" to "Jiné"
    )
    val petTaskTypes = listOf(
        "vaccination" to "Očkování",
        "deworming" to "Odčervení",
        "antiparasitic" to "Antiparazitika",
        "vet_visit" to "Návštěva veterináře",
        "grooming" to "Úprava srsti",
        "medication" to "Léky",
        "feeding" to "Krmení",
        "custom" to "Vlastní"
    )
    val plantTaskTypes = listOf(
        "water" to "Zalévání",
        "fertilize" to "Hnojení",
        "repot" to "Přesazení",
        "mist" to "Mlžení",
        "clean_leaves" to "Čištění listů",
        "custom" to "Vlastní"
    )
    val lightRequirements = listOf(
        "direct_sun" to "Přímé slunce",
        "bright_indirect" to "Světlé nepřímé světlo",
        "semi_shade" to "Polostín",
        "shade" to "Stín"
    )
    val petToxicity = listOf("safe" to "Bezpečná", "mildly_toxic" to "Mírně toxická", "toxic" to "Toxická")
    val healthStatus = listOf(
        "healthy" to "Zdravá",
        "needs_attention" to "Vyžaduje pozornost",
        "sick" to "Nemocná"
    )
    val medicineCategories = listOf(
        "pain_fever" to "Bolest & horečka",
        "cold_cough" to "Nachlazení & kašel",
        "digestion" to "Trávení",
        "allergy" to "Alergie",
        "injury_disinfection" to "Úrazy & dezinfekce",
        "eyes_ears" to "Oči & uši",
        "chronic_rx" to "Chronická léčba",
        "vitamins" to "Vitamíny",
        "first_aid_material" to "První pomoc",
        "other" to "Ostatní"
    )
    val medicineForms = listOf(
        "tablets" to "Tablety",
        "syrup" to "Sirup",
        "drops" to "Kapky",
        "ointment" to "Masť",
        "spray" to "Sprej",
        "injection" to "Injekce",
        "dressing" to "Obvaz",
        "device" to "Přístroj",
        "other" to "Ostatní"
    )
    val medicineLocations = listOf(
        "bathroom" to "Koupelna",
        "kitchen" to "Kuchyně",
        "travel_kit" to "Cestovní lékárnička",
        "cottage" to "Chata",
        "car" to "Auto",
        "bedroom" to "Ložnice",
        "other" to "Jinde"
    )
    val medicineUnits = listOf("ks", "tablety", "ml", "dávky", "balení")
    val ageGroups = listOf(
        "all" to "Pro všechny",
        "adults_only" to "Pouze dospělí",
        "kids_from_3yo" to "Děti od 3 let",
        "infants" to "Kojenci",
        "seniors" to "Senioři"
    )
    val foodRelation = listOf(
        "any" to "Kdykoliv",
        "before_food" to "Před jídlem",
        "with_food" to "S jídlem",
        "after_food" to "Po jídle",
        "empty_stomach" to "Nalačno"
    )
    val timeSlots = listOf(
        "morning" to "Ráno",
        "noon" to "Poledne",
        "evening" to "Večer",
        "bedtime" to "Před spaním"
    )
    val financeCategories = listOf(
        "groceries" to "Potraviny",
        "housing" to "Bydlení",
        "utilities" to "Energie & voda",
        "transport" to "Doprava",
        "health" to "Zdraví",
        "entertainment" to "Zábava",
        "dining" to "Restaurace",
        "clothing" to "Oblečení",
        "kids" to "Děti",
        "pets" to "Mazlíčci",
        "household" to "Domácnost",
        "other" to "Ostatní"
    )
    val billingCycles = listOf(
        "monthly" to "Měsíčně",
        "quarterly" to "Čtvrtletně",
        "yearly" to "Ročně"
    )
    val documentCategories = listOf(
        "warranty" to "Záruční list",
        "invoice" to "Faktura",
        "contract" to "Smlouva",
        "insurance" to "Pojištění",
        "manual" to "Manuál",
        "certificate" to "Certifikát",
        "id_document" to "Osobní doklad",
        "medical" to "Zdravotní",
        "other" to "Ostatní"
    )
    val vehicleFuelTypes = listOf(
        "petrol" to "Benzín",
        "diesel" to "Nafta",
        "lpg" to "LPG",
        "cng" to "CNG",
        "hybrid" to "Hybrid",
        "electric" to "Elektro",
        "other" to "Jiné"
    )
    val transmissions = listOf("manual" to "Manuální", "automatic" to "Automat")
    val tireTypes = listOf(
        "summer" to "Letní",
        "winter" to "Zimní",
        "all_season" to "Celoroční"
    )
    val serviceTypes = listOf(
        "regular_service" to "Pravidelný servis",
        "oil_change" to "Výměna oleje",
        "brakes" to "Brzdy",
        "tires" to "Pneumatiky",
        "inspection" to "Prohlídka",
        "repair" to "Oprava",
        "other" to "Ostatní"
    )
    val assetCategories = listOf(
        "large_appliance" to "Velký spotřebič",
        "small_appliance" to "Malý spotřebič",
        "electronics" to "Elektronika",
        "tools_garden" to "Nářadí & zahrada",
        "furniture" to "Nábytek",
        "plumbing_hvac" to "Voda & topení",
        "other" to "Ostatní"
    )
    val assetStatuses = listOf(
        "active" to "V provozu",
        "in_repair" to "V opravě",
        "disposed" to "Vyřazeno",
        "sold" to "Prodáno"
    )
    val activityModules = listOf(
        "recipes" to "Recepty",
        "pantry" to "Spíž",
        "shopping" to "Nákup",
        "plants" to "Květiny",
        "pets" to "Mazlíčci",
        "chores" to "Úkoly",
        "finance" to "Finance",
        "documents" to "Dokumenty",
        "vehicles" to "Vozidla",
        "medicines" to "Lékárnička",
        "assets" to "Spotřebiče",
        "meal_plans" to "Jídelníček",
        "auth" to "Přihlášení",
        "system" to "Systém"
    )

    fun label(list: List<Pair<String, String>>, key: String?): String =
        list.firstOrNull { it.first == key }?.second ?: key ?: "—"

    fun keys(list: List<Pair<String, String>>): List<String> = list.map { it.first }

    fun moduleLabel(key: String?): String = label(activityModules, key)

    fun categoryLabel(key: String?): String = label(shoppingCategories, key)
}
