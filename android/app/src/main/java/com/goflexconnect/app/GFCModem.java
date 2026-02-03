package com.goflexconnect.app;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.telephony.CellInfo;
import android.telephony.CellInfoLte;
import android.telephony.CellInfoNr;
import android.telephony.CellSignalStrengthLte;
import android.telephony.CellSignalStrengthNr;
import android.telephony.TelephonyManager;
import android.util.Log;
import androidx.core.app.ActivityCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;

@CapacitorPlugin(name = "GFCModem")
public class GFCModem extends Plugin {
    private static final String TAG = "GFCModem";
    private TelephonyManager telephonyManager;

    @Override
    public void load() {
        super.load();
        telephonyManager = (TelephonyManager) getContext().getSystemService(Context.TELEPHONY_SERVICE);
        Log.d(TAG, "GFCModem plugin LOADED!");
    }

    @PluginMethod
    public void getSignal(PluginCall call) {
        Log.d(TAG, "getSignal() called");
        
        try {
            JSObject result = extractSignalData();
            Log.d(TAG, "getSignal() returning: " + result.toString());
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "getSignal() error: " + e.getMessage(), e);
            call.resolve(getDefaultSignalData());
        }
    }

    private JSObject extractSignalData() {
        JSObject data = new JSObject();
        
        try {
            // Get carrier name
            String carrierName = telephonyManager.getNetworkOperatorName();
            data.put("carrierName", carrierName != null && !carrierName.isEmpty() ? carrierName : "Unknown");
            
            // Check permissions
            if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                Log.w(TAG, "Missing location permission");
                data.put("networkType", "NO PERMISSION");
                data.put("rsrp", -140);
                data.put("rsrq", -20);
                data.put("sinr", -10);
                return data;
            }
            
            // Get all cell info
            List<CellInfo> cellInfoList = telephonyManager.getAllCellInfo();
            
            if (cellInfoList != null && !cellInfoList.isEmpty()) {
                for (CellInfo cellInfo : cellInfoList) {
                    if (!cellInfo.isRegistered()) continue;
                    
                    // Handle 5G NR
                    if (cellInfo instanceof CellInfoNr) {
                        CellInfoNr cellInfoNr = (CellInfoNr) cellInfo;
                        CellSignalStrengthNr signalNr = (CellSignalStrengthNr) cellInfoNr.getCellSignalStrength();
                        
                        data.put("networkType", "5G NR");
                        data.put("rsrp", signalNr.getSsRsrp());
                        data.put("rsrq", signalNr.getSsRsrq());
                        data.put("sinr", signalNr.getSsSinr());
                        
                        Log.d(TAG, "Extracted 5G data: " + data.toString());
                        return data;
                    }
                    // Handle LTE
                    else if (cellInfo instanceof CellInfoLte) {
                        CellInfoLte cellInfoLte = (CellInfoLte) cellInfo;
                        CellSignalStrengthLte signalLte = cellInfoLte.getCellSignalStrength();
                        
                        data.put("networkType", "LTE");
                        data.put("rsrp", signalLte.getRsrp());
                        data.put("rsrq", signalLte.getRsrq());
                        data.put("sinr", signalLte.getRssnr());
                        
                        Log.d(TAG, "Extracted LTE data: " + data.toString());
                        return data;
                    }
                }
            }
            
            Log.w(TAG, "No registered cell info found");
            
        } catch (SecurityException e) {
            Log.e(TAG, "Security exception: " + e.getMessage());
        } catch (Exception e) {
            Log.e(TAG, "Error extracting signal: " + e.getMessage(), e);
        }
        
        return getDefaultSignalData();
    }

    private JSObject getDefaultSignalData() {
        JSObject data = new JSObject();
        String carrier = telephonyManager != null ? telephonyManager.getNetworkOperatorName() : "Unknown";
        data.put("carrierName", carrier != null && !carrier.isEmpty() ? carrier : "Unknown");
        data.put("networkType", "Searching");
        data.put("rsrp", -140);
        data.put("rsrq", -20);
        data.put("sinr", -10);
        return data;
    }
}