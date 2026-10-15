import { inject } from '@angular/core';
import { NavigationService } from 'app/core/navigation/navigation.service';

export const initialDataResolver = () =>
{
    const navigationService = inject(NavigationService);

    return navigationService.get();
};

export const residentDataResolver = () =>
{
    localStorage.setItem('selectedModuleCode', '7');
    return inject(NavigationService).get();
};
