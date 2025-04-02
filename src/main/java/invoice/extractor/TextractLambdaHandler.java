package invoice.extractor;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import software.amazon.awssdk.eventnotifications.s3.model.S3EventNotification;

import java.util.Map;

public class TextractLambdaHandler implements RequestHandler<S3EventNotification, Map<String, String>> {

    private final StartTextractLambda startTextractLambda = new StartTextractLambda();

    @Override
    public Map<String, String> handleRequest(S3EventNotification event, Context context) {
        return startTextractLambda.handleRequest(event);
    }
}