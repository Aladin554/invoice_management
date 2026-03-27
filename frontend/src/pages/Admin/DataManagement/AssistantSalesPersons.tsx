import PeopleCrudPage from "./PeopleCrudPage";

export default function AssistantSalesPersons() {
  return (
    <PeopleCrudPage
      title="Assistant Sales Persons"
      singularTitle="Assistant Sales Person"
      endpoint="/assistant-sales-persons"
    />
  );
}
