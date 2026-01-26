package com.goflexconnect.app;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "GoFlexRF";
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        Log.d(TAG, "MainActivity onCreate - BEFORE super.onCreate()");
        
        // CRITICAL: Register plugin BEFORE super.onCreate() in Capacitor 6
        registerPlugin(GFCModem.class);
        Log.d(TAG, "GFCModem plugin registered BEFORE super.onCreate()");
        
        super.onCreate(savedInstanceState);
        
        Log.d(TAG, "MainActivity onCreate - AFTER super.onCreate()");
    }
}