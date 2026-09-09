using System;
using System.Collections.Generic;
using System.Linq;

namespace Sample.Services;

public record WeatherForecast(DateOnly Date, int TemperatureC, string Summary);

public interface IWeatherService
{
    IEnumerable<WeatherForecast> GetForecast(int days);

    WeatherForecast GetForecastForCity(string city);
}

public class WeatherService : IWeatherService
{
    private static readonly string[] Summaries = { "Freezing", "Mild", "Scorching" };

    public IEnumerable<WeatherForecast> GetForecast(int days)
    {
        return Enumerable.Range(1, days).Select(index => new WeatherForecast(
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            Summaries[Random.Shared.Next(Summaries.Length)]));
    }

    public WeatherForecast GetForecastForCity(string city)
    {
        return GetForecast(1).First();
    }
}
