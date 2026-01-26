package com.goflexconnect.app;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationManager;
import android.os.Build;
import android.telephony.CellInfo;
import android.telephony.CellInfoLte;
import android.telephony.CellInfoNr;
import android.telephony.CellSignalStrengthLte;
import android.telephony.CellSignalStrengthNr;
import android.telephony.CellIdentityLte;
import android.telephony.CellIdentityNr;
import android.telephony.TelephonyManager;
import android.util.Log;
import androidx.core.app.ActivityCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.List;

@CapacitorPlugin(
    name = "GFCModem",
    permissions = {
        @Permission(strings = {Manifest.permission.READ_PHONE_STATE, Manifest.permission.ACCESS_FINE_LOCATION}, alias = "cellularAndLocation")
    }
)
public class GFCModem extends Plugin {
    
    private static final String TAG = "GFCModem";
    
    @Override
    public void load() {
        super.load();
        Log.d(TAG, "GFCModem plugin LOADED!");
    }
    
    @PluginMethod
    public void getSignal(PluginCall call) {
        Log.d(TAG, "getSignal() called - checking permissions");
        
        if (getPermissionState("cellularAndLocation") != PermissionState.GRANTED) {
            Log.w(TAG, "Permissions not granted, requesting...");
            requestPermissionForAlias("cellularAndLocation", call, "permissionCallback");
            return;
        }
        
        fetchSignalData(call);
    }
    
    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        if (getPermissionState("cellularAndLocation") == PermissionState.GRANTED) {
            Log.d(TAG, "Permissions granted, fetching signal data");
            fetchSignalData(call);
        } else {
            Log.e(TAG, "Permissions denied by user");
            call.reject("Permissions required: READ_PHONE_STATE and ACCESS_FINE_LOCATION");
        }
    }
    
    private void fetchSignalData(PluginCall call) {
        Log.d(TAG, "fetchSignalData() - fetching REAL hardware data");
        
        JSObject ret = new JSObject();
        
        try {
            Context context = getContext();
            TelephonyManager telephonyManager = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
            
            String carrierName = telephonyManager.getNetworkOperatorName();
            if (carrierName == null || carrierName.isEmpty()) {
                carrierName = "Unknown";
            }
            ret.put("carrierName", carrierName);
            
            String networkType = "Unknown";
            try {
                networkType = getNetworkType(telephonyManager);
            } catch (SecurityException e) {
                Log.w(TAG, "Could not get network type: " + e.getMessage());
            }
            ret.put("networkType", networkType);
            
            List<CellInfo> cellInfoList = telephonyManager.getAllCellInfo();
            
            if (cellInfoList != null && !cellInfoList.isEmpty()) {
                for (CellInfo cellInfo : cellInfoList) {
                    if (cellInfo.isRegistered()) {
                        if (cellInfo instanceof CellInfoLte) {
                            CellInfoLte cellInfoLte = (CellInfoLte) cellInfo;
                            CellSignalStrengthLte signalStrength = cellInfoLte.getCellSignalStrength();
                            CellIdentityLte cellIdentity = cellInfoLte.getCellIdentity();
                            
                            ret.put("rsrp", signalStrength.getRsrp());
                            ret.put("rsrq", signalStrength.getRsrq());
                            ret.put("rssi", signalStrength.getRssi());
                            ret.put("sinr", signalStrength.getRssnr());
                            ret.put("cellId", String.valueOf(cellIdentity.getCi()));
                            
                            // Get LTE band (EARFCN to band conversion)
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                                int earfcn = cellIdentity.getEarfcn();
                                int band = earfcnToBand(earfcn);
                                ret.put("band", band > 0 ? "B" + band : "Unknown");
                                ret.put("earfcn", earfcn);
                            } else {
                                ret.put("band", "N/A");
                                ret.put("earfcn", 0);
                            }
                            
                            Log.d(TAG, "LTE Signal - RSRP: " + signalStrength.getRsrp() + ", Band: " + ret.get("band"));
                            break;
                        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && cellInfo instanceof CellInfoNr) {
                            CellInfoNr cellInfoNr = (CellInfoNr) cellInfo;
                            CellSignalStrengthNr signalStrength = (CellSignalStrengthNr) cellInfoNr.getCellSignalStrength();
                            CellIdentityNr cellIdentity = (CellIdentityNr) cellInfoNr.getCellIdentity();
                            
                            ret.put("rsrp", signalStrength.getSsRsrp());
                            ret.put("rsrq", signalStrength.getSsRsrq());
                            ret.put("rssi", signalStrength.getSsRsrp());
                            ret.put("sinr", signalStrength.getSsSinr());
                            ret.put("cellId", String.valueOf(cellIdentity.getNci()));
                            
                            // Get 5G NR band
                            int nrarfcn = cellIdentity.getNrarfcn();
                            int band = nrarfcnToBand(nrarfcn);
                            ret.put("band", band > 0 ? "n" + band : "Unknown");
                            ret.put("nrarfcn", nrarfcn);
                            
                            Log.d(TAG, "5G NR Signal - RSRP: " + signalStrength.getSsRsrp() + ", Band: " + ret.get("band"));
                            break;
                        }
                    }
                }
            }
            
            if (!ret.has("rsrp")) {
                ret.put("rsrp", -999);
                ret.put("rsrq", -999);
                ret.put("rssi", -999);
                ret.put("sinr", -999);
                ret.put("cellId", "N/A");
                ret.put("band", "N/A");
                Log.w(TAG, "No registered cell info found");
            }
            
            LocationManager locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
            Location location = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            if (location == null) {
                location = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
            }
            
            if (location != null) {
                ret.put("latitude", location.getLatitude());
                ret.put("longitude", location.getLongitude());
                ret.put("accuracy", location.getAccuracy());
                ret.put("altitude", location.getAltitude());
            } else {
                ret.put("latitude", 0.0);
                ret.put("longitude", 0.0);
                ret.put("accuracy", 0.0);
                ret.put("altitude", 0.0);
            }
            
            ret.put("timestamp", System.currentTimeMillis());
            
            Log.d(TAG, "Returning REAL data: " + ret.toString());
            call.resolve(ret);
            
        } catch (Exception e) {
            Log.e(TAG, "Error: " + e.getMessage(), e);
            call.reject("Error getting signal data", e);
        }
    }
    
    private String getNetworkType(TelephonyManager telephonyManager) {
        int networkType = telephonyManager.getDataNetworkType();
        
        switch (networkType) {
            case TelephonyManager.NETWORK_TYPE_NR:
                return "5G";
            case TelephonyManager.NETWORK_TYPE_LTE:
                return "LTE";
            case TelephonyManager.NETWORK_TYPE_HSPAP:
            case TelephonyManager.NETWORK_TYPE_HSPA:
            case TelephonyManager.NETWORK_TYPE_HSUPA:
            case TelephonyManager.NETWORK_TYPE_HSDPA:
            case TelephonyManager.NETWORK_TYPE_UMTS:
                return "3G";
            case TelephonyManager.NETWORK_TYPE_EDGE:
            case TelephonyManager.NETWORK_TYPE_GPRS:
                return "2G";
            default:
                return "Unknown";
        }
    }
    
    private int earfcnToBand(int earfcn) {
        // LTE EARFCN to Band conversion (simplified - major bands)
        if (earfcn >= 0 && earfcn <= 599) return 1;
        if (earfcn >= 600 && earfcn <= 1199) return 2;
        if (earfcn >= 1200 && earfcn <= 1949) return 3;
        if (earfcn >= 1950 && earfcn <= 2399) return 4;
        if (earfcn >= 2400 && earfcn <= 2649) return 5;
        if (earfcn >= 2650 && earfcn <= 2749) return 6;
        if (earfcn >= 2750 && earfcn <= 3449) return 7;
        if (earfcn >= 3450 && earfcn <= 3799) return 8;
        if (earfcn >= 3800 && earfcn <= 4149) return 9;
        if (earfcn >= 4150 && earfcn <= 4749) return 10;
        if (earfcn >= 4750 && earfcn <= 4949) return 11;
        if (earfcn >= 5010 && earfcn <= 5179) return 12;
        if (earfcn >= 5180 && earfcn <= 5279) return 13;
        if (earfcn >= 5280 && earfcn <= 5379) return 14;
        if (earfcn >= 5730 && earfcn <= 5849) return 17;
        if (earfcn >= 5850 && earfcn <= 5999) return 18;
        if (earfcn >= 6000 && earfcn <= 6149) return 19;
        if (earfcn >= 6150 && earfcn <= 6449) return 20;
        if (earfcn >= 6450 && earfcn <= 6599) return 21;
        if (earfcn >= 6600 && earfcn <= 7399) return 22;
        if (earfcn >= 7500 && earfcn <= 7699) return 23;
        if (earfcn >= 7700 && earfcn <= 8039) return 24;
        if (earfcn >= 8040 && earfcn <= 8689) return 25;
        if (earfcn >= 8690 && earfcn <= 9039) return 26;
        if (earfcn >= 9040 && earfcn <= 9209) return 27;
        if (earfcn >= 9210 && earfcn <= 9659) return 28;
        if (earfcn >= 9660 && earfcn <= 9769) return 29;
        if (earfcn >= 9770 && earfcn <= 9869) return 30;
        if (earfcn >= 9870 && earfcn <= 9919) return 31;
        if (earfcn >= 36000 && earfcn <= 36199) return 33;
        if (earfcn >= 36200 && earfcn <= 36349) return 34;
        if (earfcn >= 36350 && earfcn <= 36949) return 35;
        if (earfcn >= 36950 && earfcn <= 37549) return 36;
        if (earfcn >= 37550 && earfcn <= 37749) return 37;
        if (earfcn >= 37750 && earfcn <= 38249) return 38;
        if (earfcn >= 38250 && earfcn <= 38649) return 39;
        if (earfcn >= 38650 && earfcn <= 39649) return 40;
        if (earfcn >= 39650 && earfcn <= 41589) return 41;
        if (earfcn >= 41590 && earfcn <= 43589) return 42;
        if (earfcn >= 43590 && earfcn <= 45589) return 43;
        if (earfcn >= 45590 && earfcn <= 46589) return 44;
        if (earfcn >= 46590 && earfcn <= 46789) return 45;
        if (earfcn >= 46790 && earfcn <= 54539) return 46;
        if (earfcn >= 54540 && earfcn <= 55239) return 47;
        if (earfcn >= 55240 && earfcn <= 56739) return 48;
        if (earfcn >= 56740 && earfcn <= 58239) return 49;
        if (earfcn >= 58240 && earfcn <= 59089) return 50;
        if (earfcn >= 59090 && earfcn <= 59139) return 51;
        if (earfcn >= 59140 && earfcn <= 60139) return 52;
        if (earfcn >= 60140 && earfcn <= 60254) return 53;
        if (earfcn >= 65536 && earfcn <= 66435) return 65;
        if (earfcn >= 66436 && earfcn <= 67335) return 66;
        if (earfcn >= 67336 && earfcn <= 67535) return 67;
        if (earfcn >= 67536 && earfcn <= 67835) return 68;
        if (earfcn >= 68336 && earfcn <= 68585) return 70;
        if (earfcn >= 68586 && earfcn <= 68935) return 71;
        if (earfcn >= 68936 && earfcn <= 68985) return 72;
        if (earfcn >= 68986 && earfcn <= 69035) return 73;
        if (earfcn >= 69036 && earfcn <= 69465) return 74;
        if (earfcn >= 69466 && earfcn <= 70315) return 85;
        return 0; // Unknown
    }
    
    private int nrarfcnToBand(int nrarfcn) {
        // 5G NR-ARFCN to Band conversion (simplified - major bands)
        if (nrarfcn >= 422000 && nrarfcn <= 434000) return 1;
        if (nrarfcn >= 386000 && nrarfcn <= 398000) return 2;
        if (nrarfcn >= 361000 && nrarfcn <= 376000) return 3;
        if (nrarfcn >= 173800 && nrarfcn <= 178800) return 5;
        if (nrarfcn >= 524000 && nrarfcn <= 538000) return 7;
        if (nrarfcn >= 185000 && nrarfcn <= 192000) return 8;
        if (nrarfcn >= 145800 && nrarfcn <= 149200) return 12;
        if (nrarfcn >= 151600 && nrarfcn <= 153600) return 13;
        if (nrarfcn >= 157600 && nrarfcn <= 161600) return 14;
        if (nrarfcn >= 158200 && nrarfcn <= 164200) return 18;
        if (nrarfcn >= 172000 && nrarfcn <= 175000) return 20;
        if (nrarfcn >= 285400 && nrarfcn <= 286400) return 25;
        if (nrarfcn >= 171800 && nrarfcn <= 178800) return 26;
        if (nrarfcn >= 151600 && nrarfcn <= 160600) return 28;
        if (nrarfcn >= 386000 && nrarfcn <= 398000) return 34;
        if (nrarfcn >= 402000 && nrarfcn <= 405000) return 38;
        if (nrarfcn >= 376000 && nrarfcn <= 384000) return 39;
        if (nrarfcn >= 460000 && nrarfcn <= 480000) return 40;
        if (nrarfcn >= 499200 && nrarfcn <= 537999) return 41;
        if (nrarfcn >= 514080 && nrarfcn <= 524000) return 48;
        if (nrarfcn >= 286400 && nrarfcn <= 303400) return 66;
        if (nrarfcn >= 285400 && nrarfcn <= 286400) return 70;
        if (nrarfcn >= 295000 && nrarfcn <= 303600) return 71;
        if (nrarfcn >= 620000 && nrarfcn <= 680000) return 77;
        if (nrarfcn >= 620000 && nrarfcn <= 653333) return 78;
        if (nrarfcn >= 693334 && nrarfcn <= 733333) return 79;
        if (nrarfcn >= 620000 && nrarfcn <= 680000) return 257;
        if (nrarfcn >= 2016667 && nrarfcn <= 2070832) return 258;
        if (nrarfcn >= 2229166 && nrarfcn <= 2279165) return 260;
        if (nrarfcn >= 2070833 && nrarfcn <= 2084999) return 261;
        return 0; // Unknown
    }
}