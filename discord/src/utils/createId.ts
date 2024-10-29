import { SnowflakeId } from '@akashrajpurohit/snowflake-id';

const snowflake = SnowflakeId({
    workerId: 1,
    epoch: 1597017600000,
});
  

export default snowflake.generate