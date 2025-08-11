import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <div className='flex flex-row items-center bg-white rounded-md w-full'>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground ">
                <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm pl-2">
                <img className='h-10 pt-1' src="/banner-amzoma.png" alt="logo" />
            </div>
        </div>
    );
}
