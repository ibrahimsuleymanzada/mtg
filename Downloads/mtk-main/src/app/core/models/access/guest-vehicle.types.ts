export interface GuestVehicleListItem {
    id: number;
    plateNumber: string;
    guestName: string | null;
    guestPhone: string | null;
    parkingSpaceName: string;
    vehicleBrand: string | null;
    vehicleModel: string | null;
    startDateTime: string;
    endDateTime: string;
    status: string;
    requestedByName: string;
}
