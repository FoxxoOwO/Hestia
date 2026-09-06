package com.example.hestia

import android.app.Application
import com.example.hestia.data.local.PreferencesManager
import com.example.hestia.data.repository.HestiaRepository

class HestiaApplication : Application() {

    lateinit var preferencesManager: PreferencesManager
        private set

    lateinit var repository: HestiaRepository
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this
        preferencesManager = PreferencesManager(this)
        repository = HestiaRepository(preferencesManager)
    }

    companion object {
        lateinit var instance: HestiaApplication
            private set
    }
}
