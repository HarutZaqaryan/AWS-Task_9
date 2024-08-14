import AWS from "aws-sdk";
import AWSXRay from "aws-xray-sdk-core";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

AWSXRay.captureAWS(AWS);

const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.target_table || "Weather";

export const handler = async (event) => {
  const eventId = uuidv4();

  try {
    const response = await axios.get(
      "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m"
    );

    const forecastData = response.data;

    const item = {
      id: eventId,
      forecast: {
        latitude: forecastData.latitude,
        longitude: forecastData.longitude,
        generationtime_ms: forecastData.generationtime_ms,
        utc_offset_seconds: forecastData.utc_offset_seconds,
        timezone: forecastData.timezone,
        timezone_abbreviation: forecastData.timezone_abbreviation,
        elevation: forecastData.elevation,
        hourly_units: {
          time: forecastData.hourly_units.time,
          temperature_2m: forecastData.hourly_units.temperature_2m,
        },
        hourly: {
          temperature_2m: forecastData.hourly.temperature_2m,
          time: forecastData.hourly.time,
        },
      },
    };

    const req = await docClient
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
