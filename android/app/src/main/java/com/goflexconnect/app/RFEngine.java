package com.goflexconnect.app;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "GFCModem")
public class RFEngine extends Plugin {
    @PluginMethod
    public void getSignal(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("rsrp", -77);
        ret.put("carrierName", "S24_MODEM_FOUND");
        call.resolve(ret);
    }
}
