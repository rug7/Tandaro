import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useTranslation } from "@/components/utils/translations";
import { 
  X, 
  Search, 
  User,
  Phone,
  UserCheck
} from "lucide-react";

export default function AssignDriverDialog({ 
  isOpen, 
  onClose, 
  drivers, 
  reservationIds, 
  onAssign, 
  language 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const { t } = useTranslation(language);

  if (!isOpen) return null;

  const filteredDrivers = drivers.filter(driver => 
    driver.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone_number?.includes(searchTerm)
  );

  const handleAssign = () => {
    if (selectedDriver) {
      onAssign(reservationIds, selectedDriver.id, selectedDriver.phone_number);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {t('تعيين سائق', 'Assign Driver')}
            </h2>
            <p className="text-gray-600">
              {t('اختر سائق لهذه الحجوزات', 'Select a driver for these reservations')} ({reservationIds.length})
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder={t('بحث عن سائق...', 'Search for driver...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rtl:pr-10 rtl:pl-3"
            />
          </div>

          {/* Selected Driver */}
          {selectedDriver && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <UserCheck className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 text-red-600" />
                  {t('السائق المختار', 'Selected Driver')}
                </h3>
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedDriver.full_name}</p>
                    <p className="text-gray-600 flex items-center" dir="ltr">
                      <Phone className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
                      {selectedDriver.phone_number}
                    </p>
                    {selectedDriver.company_name && (
                      <p className="text-sm text-gray-500">{selectedDriver.company_name}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Driver List */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {filteredDrivers.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm 
                    ? t('لم يتم العثور على سائقين', 'No drivers found')
                    : t('لا يوجد سائقين متاحين', 'No drivers available')
                  }
                </p>
              </div>
            ) : (
              filteredDrivers.map(driver => (
                <Card
                  key={driver.id}
                  className={`cursor-pointer transition-all ${
                    selectedDriver?.id === driver.id 
                      ? 'border-red-300 bg-red-50' 
                      : 'hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedDriver(driver)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{driver.full_name}</p>
                        <p className="text-gray-600 text-sm flex items-center" dir="ltr">
                          <Phone className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
                          {driver.phone_number}
                        </p>
                        {driver.company_name && (
                          <p className="text-xs text-gray-500">{driver.company_name}</p>
                        )}
                      </div>
                      {selectedDriver?.id === driver.id && (
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <UserCheck className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              {t('إلغاء', 'Cancel')}
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={!selectedDriver}
              className="gradient-red text-white"
            >
              {t('تعيين السائق', 'Assign Driver')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}