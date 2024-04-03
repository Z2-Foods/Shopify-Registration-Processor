// This script integrates with Shopify's API to handle customer registration and related tasks.
// Ensure you have set up environment variables for Shopify credentials such as shopifyStore, apiVersion, accessToken, storefrontAccessToken, and userPass.

// Import necessary dependencies
const axios = require('axios');
const cors = require('cors');
const { graphqlHTTP } = require('express-graphql');
const bodyParser = require('body-parser');
const express = require('express');

// Replace with your actual Shopify store credentials
const shopifyStore = process.env.shopifyStore;
const apiVersion = process.env.apiVersion;
const accessToken = process.env.accessToken;
const storefrontAccessToken = process.env.storefrontAccessToken;
const userPass = process.env.userPass;

// Create an Express application
const app = express();

// Use CORS middleware
app.use(cors());
app.use(bodyParser.json());

// Function to assign a customer to a company in Shopify
async function assignCompany(CompanyID, CustomerID) {
  try {
    const response = await axios.post(
      `https://${shopifyStore}/admin/api/${apiVersion}/graphql.json`,
      {
        query: `
          mutation companyAssignCustomerAsContact($companyId: ID!, $customerId: ID!) {
            companyAssignCustomerAsContact(companyId: $companyId, customerId: $customerId) {
              companyContact {
                id
                createdAt
                updatedAt
                isMainContact
                locale
                title
                company {
                  id
                  name
                }
                customer {
                  id
                  firstName
                  lastName
                }
              }
              userErrors {
                field
                message
              }
            }
          }
        `,
        variables: {
          companyId: `gid://shopify/Company/${CompanyID}`,
          customerId: `gid://shopify/Customer/${CustomerID}`
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
      }
    );
    return response;
  } catch (error) {
    console.error('Error creating company:', error.message);
    throw error;
  }
}

// Handle POST requests to the endpoint for processing Shopify registration
app.post('/process-shopify-registration', async (req, res) => {
  const customFieldValues = req.body.customer;
  const customMetafieldsValues = req.body.metafield;
  
  // Check if customFieldValues and customMetafieldsValues are not null or undefined
  if (customFieldValues !== null && customMetafieldsValues !== null) {
    // Call the updateMetafields function only when values are not null or undefined
    updateMetafields(customFieldValues, customMetafieldsValues);
    res.status(200).send('Form data received successfully');
  } else {
    // Handle the case where values are null or undefined
    res.status(400).send('Invalid input: customFieldValues or customMetafieldsValues is missing');
  }
});

// Function to create a company in Shopify
async function createCompany(customFieldValues, provinceCode) {
  try {
    const response = await axios.post(
      `https://${shopifyStore}/admin/api/${apiVersion}/graphql.json`,
      {
        query: `
          mutation companyCreate($input: CompanyCreateInput!) {
            companyCreate(input: $input) {
              company {
                id
              }
              userErrors {
                code
                field
                message
              }
            }
          }
        `,
        variables: {
          "input": {
            "company": {
              "externalId": "",
              "name": customFieldValues.FirstName
            },
            "companyLocation": {
              "billingAddress": {
                "address1": customFieldValues.Logradouro + ", " + customFieldValues.Number,
                "address2": customFieldValues.Complement,
                "city": customFieldValues.city,
                "countryCode": "BR",
                "firstName": customFieldValues.FirstName,
                "lastName": customFieldValues.Trading_name,
                "zip": customFieldValues.CEP,
                "zoneCode": provinceCode
              },
              "shippingAddress": {
                "address1": customFieldValues.Logradouro + ", " + customFieldValues.Number,
                "address2": customFieldValues.Complement,
                "city": customFieldValues.city,
                "countryCode": "BR",
                "firstName": customFieldValues.FirstName,
                "lastName": customFieldValues.Trading_name,
                "zip": customFieldValues.CEP,
                "zoneCode": provinceCode
              },
              
              "billingSameAsShipping": false,
              "buyerExperienceConfiguration": {
                "checkoutToDraft": true
              },
              "externalId": "",
              "locale": "pt_BR",
              "name": customFieldValues.FirstName,
              "note": "",
              "taxExemptions": [],
              "taxRegistrationId": ""
            }
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
      }
    );
    if (response.data.errors) {
      console.error('GraphQL mutation returned errors:', response.data.errors);
      // Handle errors as needed, you might want to throw an error, log, or handle them differently
    } else {
      // Check if the mutation was successful
      const companyResult = response.data.data.companyCreate;
      if (companyResult.userErrors && companyResult.userErrors.length > 0) {
        console.error('GraphQL mutation user errors:', companyResult.userErrors);
        // Handle user errors as needed
      } else {
        // The mutation was successful, and you can access the new company's ID
        const companyId = companyResult.company.id.replace(/\D/g, '');
        
        // You can return or perform additional actions based on the successful response
        return companyId;
      }
    }
  } catch (error) {
    console.error('Error creating company:', error.message);
    throw error;
  }
}

// Function to create a customer in Shopify
async function createIdUser(customFieldValues) {
  try {    
    // Make a POST request to Shopify's GraphQL endpoint to create a customer
    const response = await fetch(`https://${shopifyStore}/api/${apiVersion}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
      },
      body: JSON.stringify({
        query: `
          mutation customerCreate($input: CustomerCreateInput!) {
            customerCreate(input: $input) {
              customer {
                id
              }
              userErrors {
                field
                message
              }
            }
          }
        `,
        variables: {
          input: {
            "firstName": customFieldValues.FirstName,
            "lastName": customFieldValues.trading_name,
            "email": customFieldValues.Email,
            "password": userPass,
            "acceptsMarketing": true
          }
        },
      }),
    });

    const responseData = await response.json();
    // Check if the response is successful and contains customer ID
    if (responseData.data && responseData.data.customerCreate && responseData.data.customerCreate.customer) {

      // Extract only the numbers from the customerId
      const customerId = responseData.data.customerCreate.customer.id.replace(/\D/g, '');

      // Return the customer ID
      return customerId;
    } else {
      console.error('Error creating customer:', response.status, response.statusText);
      return null; // Return null or handle the error as needed
    }

  } catch (error) {
    console.error('Error creating customer:', error);
    return null; // Return null or handle the error as needed
  }
}


  // Function to update customer metafields in Shopify
  async function updateMetafields(customFieldValues, customMetafieldsValues) {
    try {
      
      const keysToSearch = ["tipo", "marca", "canal", "estadual"]; // Keys to search for in metafields
  
      let provinceCode = ''; // Determine province code based on UF value

      // Cases for different UF values
      switch (customFieldValues.UF) {
        case 'Acre':
          provinceCode = 'AC';
          break;
        case 'Alagoas':
          provinceCode = 'AL';
          break;
        case 'Amapá':
          provinceCode = 'AP';
          break;
        case 'Amazonas':
          provinceCode = 'AM';
          break;
        case 'Bahia':
          provinceCode = 'BA';
          break;
        case 'Ceará':
          provinceCode = 'CE';
          break;
        case 'Distrito Federal':
          provinceCode = 'DF';
          break;
        case 'Espírito Santo':
          provinceCode = 'ES';
          break;
        case 'Goiás':
          provinceCode = 'GO';
          break;
        case 'Maranhão':
          provinceCode = 'MA';
          break;
        case 'Mato Grosso':
          provinceCode = 'MT';
          break;
        case 'Mato Grosso do Sul':
          provinceCode = 'MS';
          break;
        case 'Minas Gerais':
          provinceCode = 'MG';
          break;
        case 'Pará':
          provinceCode = 'PA';
          break;
        case 'Paraíba':
          provinceCode = 'PB';
          break;
        case 'Paraná':
          provinceCode = 'PR';
          break;
        case 'Pernambuco':
          provinceCode = 'PE';
          break;
        case 'Piauí':
          provinceCode = 'PI';
          break;
        case 'Rio de Janeiro':
          provinceCode = 'RJ';
          break;
        case 'Rio Grande do Norte':
          provinceCode = 'RN';
          break;
        case 'Rio Grande do Sul':
          provinceCode = 'RS';
          break;
        case 'Rondônia':
          provinceCode = 'RO';
          break;
        case 'Roraima':
          provinceCode = 'RR';
          break;
        case 'Santa Catarina':
          provinceCode = 'SC';
          break;
        case 'São Paulo':
          provinceCode = 'SP';
          break;
        case 'Sergipe':
          provinceCode = 'SE';
          break;
        case 'Tocantins':
          provinceCode = 'TO';
          break;
        default:
          // Handle other cases or set a default value
          break;
      }
      
      // Create a new customer and company in Shopify
      const customerId = await createIdUser(customFieldValues);  
      if (customFieldValues !== undefined && provinceCode !== undefined) {
        const companyId = await createCompany(customFieldValues, provinceCode); 
        const result = await assignCompany(companyId, customerId);
      } else {
        // Handle the case where either companyId or provinceCode is undefined
        console.log("customFieldValues or provinceCode is undefined");
      }

      // Make a PUT request to update customer details and metafields in Shopify
      const response = await axios.put(`https://${shopifyStore}/admin/api/${apiVersion}/customers/${customerId}.json`, {
        "customer": {
          "addresses": [
            {
              "customer_id": customerId,
              "first_name": customFieldValues.FirstName,
              "last_name": "",
              "company": customFieldValues.CNPJ,
              "address1": customFieldValues.Logradouro + ", " + customFieldValues.Number,
              "address2": customFieldValues.Complement,
              "city": customFieldValues.city,
              "province": customFieldValues.UF,
              "country": "Brazil",
              "zip": customFieldValues.CEP,
              "phone": customFieldValues.Cell,
              "name": customFieldValues.Complete_name,
              "province_code": provinceCode,
              "country_code": "BR",
              "country_name": "Brazil",
              "default": true
            }
          ],
          "metafields": keysToSearch.map(key => ({
            "namespace": "custom",
            "key": key,
            "value": customMetafieldsValues[key]
          }))
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
      });

      //console.log('PUT Response:', response.data);
    } catch (error) {
      console.error('PUT Error:', error.response ? error.response.data : error.message);
      
    }
  }

// Set the server to listen on port 3000
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
