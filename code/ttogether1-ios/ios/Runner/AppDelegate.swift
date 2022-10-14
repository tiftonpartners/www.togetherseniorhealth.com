import UIKit
import Flutter
import AppsFlyerLib

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GeneratedPluginRegistrant.register(with: self)
    UIApplication.shared.isIdleTimerDisabled = true
    AppsFlyerLib.shared().appsFlyerDevKey = "njaN87XyrVi7kPhtuNHRBD"
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }    
  override func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
      if #available(iOS 9.0, *) {
          AppsFlyerLib.shared().continue(userActivity, restorationHandler: nil)
      } else {
          // Fallback on earlier versions
      }
      return true
  }
    
    override func application(_ application: UIApplication, open url: URL, sourceApplication: String?, annotation: Any) -> Bool {
      AppsFlyerLib.shared().handleOpen(url, sourceApplication: sourceApplication, withAnnotation: annotation)
      return true
    }
    
    override func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
      AppsFlyerLib.shared().handleOpen(url, options: options)
      return true
    }
}
