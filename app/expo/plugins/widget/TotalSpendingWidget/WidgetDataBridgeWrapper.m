#import <React/RCTBridgeModule.h>
#import <React/RCTBridge.h>

@interface RCT_EXTERN_MODULE(WidgetDataBridge, NSObject)

RCT_EXTERN_METHOD(updateTotal:(nonnull NSNumber)total
                  label:(nonnull NSString)label
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(updateSpendingData:(nonnull NSNumber)total
                  label:(nonnull NSString)label
                  categories:(nonnull NSString)categoriesJson
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(updateSpendingDataV2:(nonnull NSNumber)total
                  label:(nonnull NSString)label
                  currency:(nonnull NSString)currency
                  categories:(nonnull NSString)categoriesJson
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(updateSpendingStrings:(nonnull NSString)totalText
                  label:(nonnull NSString)label
                  categories:(nonnull NSString)categoriesJson
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(updateSpendingStringsForPeriod:(nonnull NSString)periodKey
                  totalText:(nonnull NSString)totalText
                  label:(nonnull NSString)label
                  categories:(nonnull NSString)categoriesJson
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end