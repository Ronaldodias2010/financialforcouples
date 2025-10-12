import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/landing/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/landing/ui/tabs";
import { Smartphone, Chrome, Share, Download, Plus, Home } from "lucide-react";

interface PWAInstallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PWAInstallModal = ({ open, onOpenChange }: PWAInstallModalProps) => {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background via-background to-muted/30">
        <DialogHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <Download className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {t('pwa.modal.title')}
          </DialogTitle>
          <p className="text-muted-foreground mt-2">
            {t('pwa.modal.subtitle')}
          </p>
        </DialogHeader>

        <Tabs defaultValue="android" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="android" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Android
            </TabsTrigger>
            <TabsTrigger value="iphone" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              iPhone
            </TabsTrigger>
          </TabsList>

          <TabsContent value="android" className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Chrome className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-green-800 dark:text-green-200">
                  {t('pwa.android.title')}
                </h3>
                <p className="text-green-600 dark:text-green-300 text-sm">
                  {t('pwa.android.subtitle')}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      {t('pwa.android.step1.title')}
                    </p>
                    <p className="text-green-600 dark:text-green-300 text-sm">
                      {t('pwa.android.step1.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      {t('pwa.android.step2.title')}
                    </p>
                    <p className="text-green-600 dark:text-green-300 text-sm">
                      {t('pwa.android.step2.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      {t('pwa.android.step3.title')}
                    </p>
                    <p className="text-green-600 dark:text-green-300 text-sm">
                      {t('pwa.android.step3.description')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="font-medium text-sm">{t('pwa.android.tip')}</span>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="iphone" className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Share className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-200">
                  {t('pwa.iphone.title')}
                </h3>
                <p className="text-blue-600 dark:text-blue-300 text-sm">
                  {t('pwa.iphone.subtitle')}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-200">
                      {t('pwa.iphone.step1.title')}
                    </p>
                    <p className="text-blue-600 dark:text-blue-300 text-sm">
                      {t('pwa.iphone.step1.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    2
                  </div>
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">
                        {t('pwa.iphone.step2.title')}
                      </p>
                      <p className="text-blue-600 dark:text-blue-300 text-sm">
                        {t('pwa.iphone.step2.description')}
                      </p>
                    </div>
                    <Share className="w-6 h-6 text-blue-500 ml-2" />
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    3
                  </div>
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">
                        {t('pwa.iphone.step3.title')}
                      </p>
                      <p className="text-blue-600 dark:text-blue-300 text-sm">
                        {t('pwa.iphone.step3.description')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Plus className="w-5 h-5 text-blue-500" />
                      <Home className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    4
                  </div>
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-200">
                      {t('pwa.iphone.step4.title')}
                    </p>
                    <p className="text-blue-600 dark:text-blue-300 text-sm">
                      {t('pwa.iphone.step4.description')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="font-medium text-sm">{t('pwa.iphone.tip')}</span>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
          <div className="text-center">
            <h4 className="font-semibold text-primary mb-2">{t('pwa.benefits.title')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>{t('pwa.benefits.offline')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>{t('pwa.benefits.fast')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>{t('pwa.benefits.native')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <Button onClick={() => onOpenChange(false)} variant="outline" className="px-8">
            {t('common.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PWAInstallModal;