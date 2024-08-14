import AWS from "aws-sdk";
import AWSXRay from "aws-xray-sdk-core";
import { v4 as uuidv4 } from "uuid";

AWSXRay.captureAWS(AWS);

const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.target_table || "Weather";

export const handler = async (event) => {
  const eventId = uuidv4();

  try {
    // Fetch weather forecast
    const response = await axios.get(
      "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m"
    );
    console.log("~~~RESPONSE from axios", response);
    const forecast = response.data;
    console.log("~~~FORECAST from axios", forecast);

    const item = {
      id: eventId,
      forecast: {
        elevation: forecast.elevation,
        generationtime_ms: forecast.generationtime_ms,
        hourly: forecast.hourly,
        hourly_units: forecast.hourly_units,
        latitude: forecast.latitude,
        longitude: forecast.longitude,
        timezone: forecast.timezone,
        timezone_abbreviation: forecast.timezone_abbreviation,
        utc_offset_seconds: forecast.utc_offset_seconds,
      },
    };
    console.log("~~~ITEM~~~", item);


    await docClient
      .put({
        TableName: tableName,
        Item: item,
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Weather forecast saved successfully",
        item,
      }),
    };
  } catch (error) {
    console.error("Error fetching or saving weather forecast:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to fetch or save weather forecast",
        error,
      }),
    };
  }
};
