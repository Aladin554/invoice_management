import PeopleCrudPage from "./PeopleCrudPage";

export default function Customers() {
  return (
    <PeopleCrudPage
      title="Customers"
      singularTitle="Customer"
      endpoint="/customers"
    />
  );
}
