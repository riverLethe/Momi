#import <React/RCTBridgeModule.h>
#import <React/RCTBridge.h>

@interface RCT_EXTERN_MODULE(WidgetBudgetDataBridge, NSObject)

RCT_EXTERN_METHOD(updateBudgetStringsForPeriod:(nonnull NSString)periodKey
                  totalText:(nonnull NSString)totalText
                  label:(nonnull NSString)label
                  segments:(nonnull NSString)segmentsJson
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end 