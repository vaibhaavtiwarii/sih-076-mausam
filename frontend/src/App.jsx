{liveHourlyForecast.length > 0
  ? liveHourlyForecast.map((item) => (
      <div className="forecast-item" key={item.time}>
        <span className="forecast-time">
          {formatForecastTime(item.time)}
        </span>

        <Icon
          name={weatherIconFromCode(item.weatherCode)}
          size={25}
        />

        <strong>{Math.round(item.temperature)}°</strong>

        <span
          className={`rain-chance ${
            item.rain > 50 ? 'high' : ''
          }`}
        >
          {item.rain}% rain
        </span>
      </div>
    ))
  : hourlyForecast.map((item) => (
      <div className="forecast-item" key={item.time}>
        <span className="forecast-time">
          {item.time}
        </span>

        <Icon name={item.icon} size={25} />

        <strong>{item.temp}°</strong>

        <span
          className={`rain-chance ${
            item.rain > 50 ? 'high' : ''
          }`}
        >
          {item.rain}% rain
        </span>
      </div>
    ))}