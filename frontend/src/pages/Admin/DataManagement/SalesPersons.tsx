import PeopleCrudPage from "./PeopleCrudPage";

export default function SalesPersons() {
  return (
    <PeopleCrudPage
      title="Sales Persons"
      singularTitle="Sales Person"
      endpoint="/sales-persons"
    />
  );
}
