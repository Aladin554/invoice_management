import { HelmetProvider, Helmet } from "react-helmet-async";

const APP_TITLE = "Connected Invoice System";
const DEFAULT_DESCRIPTION = "Connected Invoice System dashboard";

const PageMeta = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <Helmet>
    <title>{APP_TITLE}</title>
    <meta name="description" content={description || DEFAULT_DESCRIPTION} />
  </Helmet>
);

export const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>
    <Helmet>
      <title>{APP_TITLE}</title>
      <meta name="description" content={DEFAULT_DESCRIPTION} />
    </Helmet>
    {children}
  </HelmetProvider>
);

export default PageMeta;
