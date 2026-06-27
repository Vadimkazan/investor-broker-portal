UPDATE t_p80180089_investor_broker_port.investment_objects
  SET property_type = 'new_flat' WHERE property_type = 'flats';

UPDATE t_p80180089_investor_broker_port.investment_objects
  SET property_type = 'houses' WHERE property_type = 'country';

ALTER TABLE t_p80180089_investor_broker_port.investment_objects
  ADD CONSTRAINT investment_objects_property_type_check
  CHECK (property_type IN (
    'apartments',
    'new_flat',
    'secondary_flat',
    'houses',
    'commercial',
    'land',
    'abroad',
    'parking',
    'storage',
    'rooms',
    'gab',
    'land_development',
    'buildings_redevelopment'
  ));
