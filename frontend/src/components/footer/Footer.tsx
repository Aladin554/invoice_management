const Footer = () => {
    return (
        <footer className="px-4 pb-6 pt-2 md:px-6">
            <div className="mx-auto flex max-w-[1600px] flex-col gap-2 rounded-[24px] border border-slate-200 bg-white/85 px-5 py-4 text-sm text-slate-500 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                <span>Connected admin panel</span>
                <span>
                    Designed by{" "}
                    <a 
                        href="#" 
                        target="_blank" 
                        className="font-medium text-blue-700 transition hover:text-blue-800 hover:underline dark:text-blue-300 dark:hover:text-blue-200"
                    >
                        Trustfolio
                    </a>
                </span>
            </div>
        </footer>
    );
};

export default Footer;
