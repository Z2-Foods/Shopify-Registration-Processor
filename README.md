# Shopify Registration Processor

This application is designed to process registration requests from Shopify stores and handle customer and company creation, along with assigning customers to companies. It utilizes Node.js with Express.js for server-side logic and Axios for making HTTP requests to the Shopify Admin API.

## Prerequisites

Before running this application, ensure you have the following:

- Node.js installed on your system.
- Access to a Shopify store with valid credentials.
- Environment variables set up for Shopify store credentials (shopifyStore, apiVersion, accessToken, storefrontAccessToken, userPass).

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/Shopify-Registration-Processor.git
   ```

2. Install dependencies:

   ```bash
   cd Shopify-Registration-Processor
   npm install
   ```

3. Set up environment variables:
   
   Create a `.env` file in the root directory and provide your Shopify store credentials:

   ```plaintext
   shopifyStore=your-shopify-store
   apiVersion=your-api-version
   accessToken=your-access-token
   storefrontAccessToken=your-storefront-access-token
   userPass=your-user-pass
   ```

## Usage

Run the application using:

```bash
npm start
```

The server will start listening on port 3000 by default.

## Endpoints

### POST `/process-shopify-registration`

This endpoint processes registration requests from Shopify stores.

- **Request Body**: Expects JSON data with customer and metafield information.
- **Response**: Returns a success message if the form data is received successfully or an error message if there's missing or invalid input.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
