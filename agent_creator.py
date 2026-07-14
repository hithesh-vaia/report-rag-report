from langchain_core.messages import AIMessage, HumanMessage, SystemMessage


section_details="SECTION A: General Disclosures, SECTION B: Management and Process Disclosures, SECTION C: Principle-wise Performance Disclosure"
SECTION_A="A1. Details of the Listed Entity, A2. Products / Services, A3. Operations, A4. Employees, A5. Holding, Subsidiary & Associate Companies, A6. CSR Details, A7. Transparency & Disclosures, A8. Complaints / Grievances, A9. Business Activities, A10. Other General Disclosures"
SECTION_B="B1. Policy & Management Processes,B2. NGRBC Principle-wise Policy Coverage"
SECTION_C="Principle 1 Businesses should conduct themselves with integrity, Principle 2 Sustainable goods and services , Principle 3 Employee Well-being , Principle 4 Stakeholder Responsiveness, Principle 5 Human Rights, Principle 6 Environment, Principle 7 Responsible Public Policy, Principle 8 Inclusive Growth,Principle 9 Customer Value"



querty_generator_a=f"Based on the given section details of a brsr report {(SECTION_A)}generate related prompts to query the vector db  maximum 3"
querty_generator_b=f"Based on the given section details of a brsr report {(SECTION_B)} generate related prompts to query the vector db  maximum 3"
querty_generator_c=f"Based on the given section details of a brsr report {(SECTION_C)} generate related prompts to query the vector db  maximum 3"


query_generator=f"Based on the  section's details of a brsr report{(section_details)} generate related prompts to query the vector db  maximum 3"
